-- First public launch ONLY. Apply this standalone migration to the submission project.
-- Do not apply the deferred player/account migrations or demo seeds for this launch.
begin;
create table public.catch_upload_sessions (
 id uuid primary key, token_hash text not null, payload_hash text not null,
 payload jsonb not null, files jsonb not null, consent jsonb not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '2 hours',
 locked_until timestamptz, completed_at timestamptz
);
create table public.catch_submissions (
 id uuid primary key, created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 status text not null default 'NEW' check(status in ('NEW','REVIEWING','SELECTED','DECLINED','NEEDS FOLLOW-UP')),
 submission_route text not null check(submission_route in ('age_13_plus','parent_guardian')),
 submitter_name text not null check(length(submitter_name) between 1 and 120),
 submitter_email text not null check(length(submitter_email) between 3 and 254),
 child_display_name text not null default '',fish_name text not null default '',
 weight_lbs numeric(5,2) not null check(weight_lbs>0 and weight_lbs<=30),
 lake text not null check(length(lake) between 1 and 160),story text not null check(length(story) between 1 and 5000),
 consent jsonb not null check(coalesce(consent->>'legal_agreement'='true' and consent->>'permission'='true' and consent->>'accuracy'='true',false)),
 internal_notes text not null default '' check(length(internal_notes)<=10000),source text not null default '/submit-your-catch',
 check(submission_route='parent_guardian' or child_display_name=''),
 check(submission_route<>'parent_guardian' or coalesce(consent->>'guardian_authority'='true',false))
);
create index catch_review_status on public.catch_submissions(status,created_at desc);
create index catch_review_date on public.catch_submissions(created_at desc);
create index catch_review_email on public.catch_submissions(submitter_email);
create table public.catch_photos (
 id uuid primary key default gen_random_uuid(),submission_id uuid not null references public.catch_submissions(id) on delete cascade,
 original_path text not null unique,preview_path text not null unique,original_name text not null,
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),bytes integer not null check(bytes between 1 and 20971520),
 width integer not null,height integer not null,position integer not null,unique(submission_id,position)
);
create table public.catch_email_outbox (
 submission_id uuid primary key references public.catch_submissions(id) on delete cascade,
 status text not null default 'PENDING' check(status in ('PENDING','ACCEPTED','FAILED','UNCERTAIN')),
 attempts integer not null default 0,provider_id text,first_attempt_at timestamptz,last_attempt_at timestamptz,accepted_at timestamptz,
 locked_until timestamptz,last_error text
);
create table public.catch_review_history (
 id bigint generated always as identity primary key,submission_id uuid not null references public.catch_submissions(id) on delete cascade,
 admin_id uuid not null,previous_status text not null,new_status text not null,notes_changed boolean not null,created_at timestamptz not null default now()
);
create table public.drop_signups (
 id uuid primary key default gen_random_uuid(),email text not null unique,created_at timestamptz not null default now(),
 consent boolean not null check(consent),consent_text text not null,consent_version text not null,source text not null,unsubscribed_at timestamptz
);
create table public.launch_rate_limits (key text primary key,window_start timestamptz not null,hits integer not null);
-- No browser role can read/write submissions, notes, marketing contacts, or pending uploads.
do $$declare t text;begin
 foreach t in array array['catch_upload_sessions','catch_submissions','catch_photos','catch_email_outbox','catch_review_history','drop_signups','launch_rate_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end$$;
grant usage,select on sequence public.catch_review_history_id_seq to service_role;

create function public.launch_rate_limit(p_key text,p_limit integer,p_window integer) returns boolean language plpgsql security definer set search_path='' as $$
declare count_now integer;begin
 insert into public.launch_rate_limits as r(key,window_start,hits) values(p_key,now(),1)
 on conflict(key) do update set hits=case when r.window_start<now()-make_interval(secs=>p_window) then 1 else r.hits+1 end,
 window_start=case when r.window_start<now()-make_interval(secs=>p_window) then now() else r.window_start end returning hits into count_now;
 return count_now<=p_limit;
end$$;

create function public.finalize_catch(p_id uuid,p_token_hash text,p_photos jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.catch_upload_sessions;begin
 select * into s from public.catch_upload_sessions where id=p_id and token_hash=p_token_hash for update;
 if not found then raise exception 'Invalid upload session';end if;
 if s.completed_at is not null then return s.id;end if;
 if s.expires_at<now() then raise exception 'Upload session expired';end if;
 if jsonb_array_length(p_photos)<>jsonb_array_length(s.files) or jsonb_array_length(p_photos) not between 1 and 5 then raise exception 'Incomplete photos';end if;
 insert into public.catch_submissions(id,submission_route,submitter_name,submitter_email,child_display_name,fish_name,weight_lbs,lake,story,consent)
 values(s.id,s.payload->>'submission_route',s.payload->>'name',s.payload->>'email',s.payload->>'child_display_name',s.payload->>'nickname',(s.payload->>'weight_lbs')::numeric,s.payload->>'lake',s.payload->>'story',s.consent);
 insert into public.catch_photos(submission_id,original_path,preview_path,original_name,mime_type,bytes,width,height,position)
 select s.id,x->>'original_path',x->>'preview_path',x->>'original_name',x->>'mime_type',(x->>'bytes')::integer,(x->>'width')::integer,(x->>'height')::integer,(x->>'position')::integer from jsonb_array_elements(p_photos) x;
 insert into public.catch_email_outbox(submission_id) values(s.id);
 update public.catch_upload_sessions set completed_at=now(),locked_until=null where id=s.id;
 return s.id;
end$$;

create function public.review_catch(p_id uuid,p_admin uuid,p_status text,p_notes text,p_updated_at timestamptz) returns boolean language plpgsql security definer set search_path='' as $$
declare s public.catch_submissions;begin
 select * into s from public.catch_submissions where id=p_id for update;
 if not found or s.updated_at<>p_updated_at then return false;end if;
 update public.catch_submissions set status=p_status,internal_notes=p_notes,updated_at=clock_timestamp() where id=p_id;
 insert into public.catch_review_history(submission_id,admin_id,previous_status,new_status,notes_changed) values(p_id,p_admin,s.status,p_status,s.internal_notes<>p_notes);
 return true;
end$$;
revoke all on function public.launch_rate_limit(text,integer,integer),public.finalize_catch(uuid,text,jsonb),public.review_catch(uuid,uuid,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.launch_rate_limit(text,integer,integer),public.finalize_catch(uuid,text,jsonb),public.review_catch(uuid,uuid,text,text,timestamptz) to service_role;

-- Only signed upload tokens issued by the server allow public uploads. No public read policies.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('catch-photos','catch-photos',false,20971520,array['image/jpeg','image/png','image/webp']);
commit;
