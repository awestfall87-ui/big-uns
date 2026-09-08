import DropSignup from "./DropSignup";
export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div className="logo">
            BIG UNS
            <span>TRADING CARDS</span>
          </div>

          <div className="navLinks">
            <a href="#cards">Cards</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#submit">Submit Your Catch</a>
            <a href="#gameplay">Gameplay</a>
            <a href="#community">Community</a>
            <a href="#shop">Shop</a>
          </div>

          <a className="navButton" href="#shop">
  JOIN THE DROP
</a>
</nav>

        <div className="heroContent">
          <div className="heroText">
            <p className="eyebrow">COLLECT • TRADE • PLAY • COMPETE</p>

            <h1>
              YOU’VE ALREADY
              <br />
              MADE THE CATCH.
              <br />
              <span>NOW MAKE IT LEGENDARY.</span>
            </h1>

            <p className="heroDescription">
              Submit any catch you’ve captured for a chance to become part of
              Big Uns Trading Cards. Selected catches can become collectible
              cards that are pulled from packs, traded, and played.
            </p>

            <div className="heroButtons">
              <a className="primaryButton" href="#submit">
                SUBMIT YOUR CATCH
              </a>

              <a className="secondaryButton" href="#how-it-works">
                SEE HOW BIG UNS WORKS
              </a>
            </div>
          </div>

 <div className="heroCardDisplay">
  <div className="heroCardTrio">
  <div className="heroCardRig">
    <div className="cardLine"></div>
    <div className="cardHook"></div>

    <div className="spinningCard">
      <div className="spinningCardFront"></div>
      <div className="spinningCardBack"></div>
    </div>
  </div>

  <div className="heroCardRig">
    <div className="cardLine"></div>
    <div className="cardHook"></div>

    <div className="spinningCard">
      <div className="spinningCardFront"></div>
      <div className="spinningCardBack"></div>
    </div>
  </div>

  <div className="heroCardRig">
    <div className="cardLine"></div>
    <div className="cardHook"></div>

    <div className="spinningCard">
      <div className="spinningCardFront"></div>
      <div className="spinningCardBack"></div>
    </div>
  </div>
</div>
  <p className="heroCardCaption">
    REAL CATCHES &nbsp; • &nbsp; REAL CARDS &nbsp; • &nbsp; BUILT TO BE PLAYED
  </p>
</div>
        </div>

        <div className="heroBottom">
          <span>REAL CATCHES</span>
          <span>REAL PEOPLE</span>
          <span>ONE COLLECTION</span>
        </div>
           </section>

      <section className="collectPlay" id="cards">
  <div className="collectPlayInner">
    <p className="sectionEyebrow">
      BUILT TO BE COLLECTED. MADE TO BE PLAYED.
    </p>

    <div className="collectPlayGrid">
      <div className="collectPlayItem">
  <span className="collectNumber">01</span>
  <h3>COLLECT</h3>
  <p>
    Build a collection of real catches, different weights, lakes, and rare
    pulls — each with its own story.
  </p>
</div>

<div className="collectPlayItem">
  <span className="collectNumber">02</span>
  <h3>TRADE</h3>
  <p>
    Trade with other collectors, chase the cards you want, and build the
    combinations your collection is missing.
  </p>
</div>

<div className="collectPlayItem">
  <span className="collectNumber">03</span>
  <h3>PLAY</h3>
  <p>
    Turn your collection into a five-fish bag and see how your cards stack up.
  </p>
</div>

<div className="collectPlayItem">
  <span className="collectNumber">04</span>
  <h3>COMPETE</h3>
  <p>
    Build five-fish bags from the same lake and compete against other players
    in Big Uns tournaments.
  </p>
</div>
    </div>
  </div>
</section><section className="catchSection" id="submit">
  <div className="catchSectionInner">
    <div className="catchCopy">
      <p className="sectionEyebrow">YOUR CATCH COULD BECOME A CARD</p>

<h2>YOUR CATCH COULD BECOME PART OF SOMETHING BIGGER.</h2>

<p>
  That bass you&apos;ll never forget could become an official Big Uns card —
  collected, traded, and played by anyone who snags it.
</p>

<p>
  If selected, your card becomes part of the First Edition set, giving anyone
  anywhere in the country the chance to pull it from a pack.
</p>

<p>
  And when they do, they can scan the card to discover the real catch and the
  story behind it.
</p>
      <a className="primaryButton" href="#">
        SUBMIT YOUR CATCH
      </a>
    </div>

    <div className="catchFacts">
      <div className="catchFact">
        <span>01</span>
        <div>
          <strong>BASS ONLY</strong>
          <p>Big Uns is currently accepting bass submissions for the first release.</p>
        </div>
      </div>

      <div className="catchFact">
        <span>02</span>
        <div>
          <strong>ANY TIME</strong>
          <p>The catch can be recent or one you made years ago.</p>
        </div>
      </div>

      <div className="catchFact">
        <span>03</span>
        <div>
          <strong>CHANCE TO BE SELECTED</strong>
          <p>Submitting a catch does not guarantee that it will become a card.</p>
        </div>
      </div>

      <div className="catchFact">
        <span>04</span>
        <div>
          <strong>RELEASED IN PACKS</strong>
          <p>
            If selected, your card
            becomes part of the First Edition set, giving anyone in the country the chance to pull it from a pack.
          </p>
        </div>
      </div>
    </div>
  </div>

</section><section className="cardShowcase">
  <div className="cardShowcaseInner">
    <div className="cardShowcaseHeader">
      <p className="sectionEyebrow">EVERY CARD STARTED WITH A REAL CATCH</p>

      <h2>COLLECT THE CATCHES. BUILD THE COLLECTION.</h2>

      <p>
  Base cards, rare pulls, and special editions give every pack something
  different to chase.
</p>
    </div>

    <div className="showcaseCards">
      <div className="showcaseCard baseShowcase">
        <div className="showcaseCardVisual">
          <span>BASE CARD</span>
        </div>

        <div className="showcaseCardText">
          <strong>BASE CARDS</strong>
          <p>The foundation of the Big Uns collection.</p>
        </div>
      </div>

      <div className="showcaseCard rareShowcase">
        <div className="showcaseCardVisual">
          <span>RARE PULL</span>
        </div>

        <div className="showcaseCardText">
          <strong>RARE PULLS</strong>
          <p>Big fish with harder-to-find holographic treatments.</p>
        </div>
      </div>

      <div className="showcaseCard specialShowcase">
        <div className="showcaseCardVisual">
          <span>SPECIAL EDITION</span>
        </div>

        <div className="showcaseCardText">
          <strong>SPECIAL EDITIONS</strong>
          <p>Unique catches, designs, and limited treatments.</p>
        </div>
      </div>
    </div>

    <div className="cardStoryCallout">
  <strong>SCAN THE CARD. DISCOVER THE CATCH.</strong>

  <p>
    Every Big Uns card connects you to the real story behind the fish.
    Eligible cards can also connect to Big Uns online tournament play.
  </p>
</div>
  </div>
</section>

      <section className="gameplayPreview" id="gameplay">
  <div className="gameplayPreviewInner">
    <div className="gameplayCopy">
      <p className="sectionEyebrow">ONLINE PLAY</p>

      <h2>BUILD YOUR FIVE-FISH BAG.</h2>

      <p>
        For online Big Uns play, build a five-fish bag using fish cards from
        the same lake.
      </p>

      <p>
        The lake is already printed on every fish card. As your collection
        grows, you&apos;ll have more same-lake combinations and more
        opportunities to compete in Big Uns tournaments.
      </p>

      <a className="secondaryButton gameplayButton" href="#">
        SEE HOW GAMEPLAY WORKS
      </a>
    </div>

    <div className="bagVisual">
      <div className="bagStat">
        <strong>5</strong>
        <span>FISH</span>
      </div>

      <div className="bagDivider">+</div>

      <div className="bagStat">
        <strong>1</strong>
        <span>LAKE</span>
      </div>

      <div className="bagDivider">=</div>

      <div className="bagStat">
        <strong>1</strong>
        <span>BAG</span>
      </div>
    </div>
  </div>

  <div className="collectionLoop">
    <span>MORE CARDS</span>
    <b>→</b>
    <span>MORE SAME-LAKE OPTIONS</span>
    <b>→</b>
    <span>MORE TOURNAMENT OPPORTUNITIES</span>
  </div>

</section>

<section className="firstDrop" id="shop">
  <div className="firstDropInner">
    <div className="firstDropCopy">
      <p className="sectionEyebrow">FIRST EDITION</p>

      <h2>BE THERE FROM THE BEGINNING.</h2>

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