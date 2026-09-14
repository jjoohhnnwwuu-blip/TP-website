// day & night lockscreen logic 
// scroll = time passing, notifs pop up as you go, tap one to see contents

(function () {

  // initialise element variables
  let sky = document.getElementById("sky");
  let stars = document.getElementById("stars");
  let orb = document.getElementById("orb");
  let timeEl = document.getElementById("time");
  let dateEl = document.getElementById("date");
  let hint = document.getElementById("hint");

  let pop = document.getElementById("pop");
  let popTitle = document.getElementById("pop-title");
  let popBody = document.getElementById("pop-body");
  let popClose = document.getElementById("pop-close");

  // Note: colour functions are ai-generated
  // lerp = blend two numbers by t (0 to 1). chan does it for an rgb colour
  function lerp(a, b, t) { return a + (b - a) * t; }
  function chan(c1, c2, t) {
    return "rgb(" +
      Math.round(lerp(c1[0], c2[0], t)) + "," +
      Math.round(lerp(c1[1], c2[1], t)) + "," +
      Math.round(lerp(c1[2], c2[2], t)) + ")";
  }
  // blends through 3 colours instead of 2 (day -> dusk -> night)
  function tri(t, a, b, c) {
    if (t < 0.5) return chan(a, b, t / 0.5);
    return chan(b, c, (t - 0.5) / 0.5);
  }

  // the colours for top/mid/bottom of the sky at each time of day [r,g,b]
  let dayTop = [74,144,217],  dayMid = [135,184,232], dayBot = [207,227,242];
  let duskTop= [224,122,63],  duskMid= [158,90,120],  duskBot= [80,70,110];
  let nightTop=[11,16,41],    nightMid=[26,35,80],    nightBot=[45,58,107];

  // turns scroll progress into a fake clock
  // starts and ends at 3am in a full 24h cycle
  function clockLabel(p) {
    let totalMin = Math.round(180 + p * (24 * 60));
    let mins = totalMin % 1440;
    let hh = Math.floor(mins / 60);
    let mm = mins % 60;
    return hh + ":" + (mm < 10 ? "0" + mm : mm);
  }

  // top date matches real date
  function setDate() {
    let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    let months = ["January","February","March","April","May","June","July","August",
                  "September","October","November","December"];
    let d = new Date();
    dateEl.textContent = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();
  }

  // runs on scroll and updates the sky/sun/stars/clock
  let ticking = false;
  function update() {
    let max = document.documentElement.scrollHeight - window.innerHeight;
    let p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

    // repaint the sky gradient depending on time of day
    // not enough time but ideally could restructure this into a night -> dawn -> day -> dusk -> night cycle
    // so clock times match with the background better
    sky.style.background = "linear-gradient(180deg," +
      tri(p, dayTop, duskTop, nightTop) + " 0%," +
      tri(p, dayMid, duskMid, nightMid) + " 55%," +
      tri(p, dayBot, duskBot, nightBot) + " 100%)";

    // sun slides down the screen and turns into the moon at the halfway point
    // similarly could start as the moon and transition into the sun at dawn 
    orb.style.top = (lerp(14, 82, p)).toFixed(1) + "%";
    if (p < 0.5) {
      orb.style.background = "#FDB813";
      orb.style.boxShadow = "0 0 60px 20px rgba(253,184,19,0.35)";
    } else {
      orb.style.background = "#e8ecf5";
      orb.style.boxShadow = "0 0 40px 12px rgba(232,236,245,0.25)";
    }

    // stars show up once it gets dark
    stars.style.opacity = p > 0.5 ? ((p - 0.5) / 0.5).toFixed(2) : "0";

    timeEl.textContent = clockLabel(p);

    // hide scroll hint once user has scrolled
    hint.style.opacity = window.scrollY > 40 ? "0" : "0.85";

    ticking = false;
  }
  // Note: requestAnimationFrame + ticking flag is an ai-suggested feature
  // don't run update on every single scroll event, wait for the next frame
  // scroll fires constantly, this limits the work to once per animation frame so it stays smooth
  function onScroll() {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }

  // makes each notif slide in when it scrolls into view instead of all at once
  let notifs = document.querySelectorAll(".notif");
  // Note: IntersectionObserver is an ai-suggested feature
  // notifies when an element enters the screen, easier than doing scroll-position maths manually
  if ("IntersectionObserver" in window) {
    let io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          let el = e.target;
          // if a chapter has 2 notifs, stagger them so they don't pop together
          let siblings = el.parentNode.querySelectorAll(".notif");
          let idx = Array.prototype.indexOf.call(siblings, el);
          setTimeout(function () { el.classList.add("show"); }, idx * 120);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.35 });
    notifs.forEach(function (n) { io.observe(n); });
  } else {
    notifs.forEach(function (n) { n.classList.add("show"); });
  }

  // the hobby notifs have pics/video so their content is html, kept here
  // (can't add img tags into an html attribute so they get a marker instead)
  function richBody(marker) {
    if (marker === "__DAY_HOBBIES__") {
      return (
        "<p><b>Fishing 🎣</b> - I go every now and then when " +
        "I've got nothing on and the weather's good. Here's the last fish I caught:</p>" +
        "<img class='pop-img' src='img/fish.jpg' alt='The last fish I caught'>" +
        "<p><b>Snowboarding 💸😭</b> - went with friends these holidays. Fell a lot and " +
        "nearly crashed on the drive back, but I finally made it up the T-bar for the " +
        "first time (iykyk):</p>" +
        "<img class='pop-img' src='img/snowboard.jpg' alt='Snowboarding trip'>" +
        "<p><b>Eating with friends 😋</b> - this chicken was from a place called " +
        "Jiho Hanbang:</p>" +
        "<img class='pop-img' src='img/chicken.jpg' alt='Chicken from Jiho Hanbang'>"
      );
    }
    if (marker === "__BADMINTON__") {
      return (
        "<p><b>Badminton 🏸</b> - my weekly exercise. I started in primary school, played " +
        "on and off through high school, and now I try to go socially twice a week. " +
        "Here's a video of me getting cooked:</p>" +
        "<div class='pop-media'>" +
        "<iframe src='https://www.youtube.com/embed/JZSizX3M_dw' " +
        "title='Badminton' allow='accelerometer; autoplay; clipboard-write; " +
        "encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>" +
        "</div>"
      );
    }
    return null;
  }

  // open the popup
  // if it's rich use innerHTML, otherwise just plain text
  function openPop(title, body) {
    popTitle.textContent = title;
    let rich = richBody(body);
    if (rich) {
      popBody.style.whiteSpace = "normal";
      popBody.innerHTML = rich;
    } else {
      popBody.style.whiteSpace = "pre-line";
      popBody.textContent = body;
    }
    pop.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closePop() {
    pop.classList.remove("open");
    document.body.style.overflow = "";
    popBody.innerHTML = "";
  }

  // tap a notif to open, handle all the ways to close it after
  notifs.forEach(function (n) {
    n.addEventListener("click", function () {
      openPop(n.getAttribute("data-title"), n.getAttribute("data-body"));
    });
  });
  popClose.addEventListener("click", closePop);
  pop.addEventListener("click", function (e) { if (e.target === pop) closePop(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && pop.classList.contains("open")) closePop();
  });

  // set date, listen for scroll/resize, run once
  setDate();
  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", update);
  update();
})();
