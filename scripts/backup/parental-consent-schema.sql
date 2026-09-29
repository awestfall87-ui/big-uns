begin;
create table public.parental_consents(
 id uuid primary key,token_hash text not null,
 parent_name text not null,parent_email text not null,document_path text not null unique,
 form_version text not null,form_url text not null,confirmation_text text not null,
 accepted_at timestamptz not null,created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '30 days',
 status text not null default 'PENDING' check(status in ('PENDING','APPROVED','DECLINED','REVOKED')),
 allow_card_publication boolean not null default false,allow_promotion boolean not null default false,
 reviewed_at timestamptz,reviewed_by uuid,review_note text,
 used_at timestamptz,delete_after timestamptz,
 submission_id uuid unique references public.catch_submissions(id) on delete set null,
 check(status<>'APPROVED' or (reviewed_at is not null and reviewed_by is not null))
);
alter table public.parental_consents enable row level security;
revoke all on public.parental_consents from public,anon,authenticated;
grant all on public.parental_consents to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('parental-consents','parental-consents',false,20971520,array['application/pdf','image/jpeg','image/png']);
-- A trigger protects every insertion path, including finalize_catch and stale sessions.
create function public.require_parental_consent() returns trigger language plpgsql set search_path='' as $$
declare c public.parental_consents;
begin
 if new.submission_route='parent_guardian' then
  select * into c from public.parental_consents where id=(new.consent->>'parental_consent_id')::uuid for update;
  if not found or c.status<>'APPROVED' or c.expires_at<now() or c.used_at is not null or c.parent_name<>new.submitter_name or c.parent_email<>new.submitter_email or c.document_path<>coalesce(new.consent->>'signed_document_path','') then raise exception 'Approved parental consent required';end if;
 end if;return new;
end$$;
create trigger require_parental_consent before insert on public.catch_submissions for each row execute function public.require_parental_consent();
create function public.link_parental_consent() returns trigger language plpgsql set search_path='' as $$begin
 if new.submission_route='parent_guardian' then update public.parental_consents set submission_id=new.id,used_at=now() where id=(new.consent->>'parental_consent_id')::uuid;end if;return new;end$$;
create trigger link_parental_consent after insert on public.catch_submissions for each row execute function public.link_parental_consent();
revoke all on function public.require_parental_consent(),public.link_parental_consent() from public,anon,authenticated;
alter table public.catch_submissions add column child_content_delete_after timestamptz;
-- Selection is blocked for guardian catches without current publication permission.
create function public.check_guardian_selection() returns trigger language plpgsql set search_path='' as $$
begin
 if new.submission_route='parent_guardian' and new.status='SELECTED' and not exists(select 1 from public.parental_consents c where c.submission_id=new.id and c.status='APPROVED' and c.allow_card_publication) then raise exception 'Current parental publication permission required';end if;
 if new.submission_route='parent_guardian' and new.status='DECLINED' then new.child_content_delete_after=now()+interval '90 days';end if;
 return new;
end$$;
create trigger check_guardian_selection before update of status on public.catch_submissions for each row execute function public.check_guardian_selection();
revoke all on function public.check_guardian_selection() from public,anon,authenticated;
commit;
