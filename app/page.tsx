import DropSignup from "./DropSignup";

export default function Home() {
  return (
    <main>
      <section className="firstDrop">
        <div className="firstDropInner">
          <div className="firstDropCopy">
            <div className="logo">
              BIG UNS
              <span>TRADING CARDS</span>
            </div>

            <p className="sectionEyebrow">FIRST EDITION</p>

            <h1>BE THERE FROM THE BEGINNING.</h1>

            <p>
              Join the Drop for early Big Uns updates, catch submission openings,
              First Edition pack releases, and tournament announcements.
            </p>
          </div>

          <DropSignup />
        </div>
      </section>
    </main>
  );
}