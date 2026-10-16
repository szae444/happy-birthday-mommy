/* ==========================================================================
   MOMMY'S BIRTHDAY CARNIVAL — everything personal lives in this file.
   Edit the text between the quotes. Put photos in the /photos folder and
   voice notes in the /audio folder, then type their file names below.
   ========================================================================== */

window.CARNIVAL = {

  name: "Mommy",
  from: "your favorite child (sorry, Bog)",   // signs the letter + map footer

  /* ---------- BACKGROUND MUSIC ---------------------------------------- */
  // Plays from YouTube. For the most reliable playback (especially on an
  // iPhone), put an MP3 in /audio and set file: "audio/song.mp3" instead.
  music: {
    youtube: "GPbG4mIgKAw",               // LANY — if this is the last time
    title: "if this is the last time · LANY",
    file: "",
    volume: 55                            // 0–100
  },

  /* ---------- BOOTH 1 · THE LOCKED GATE ------------------------------- */
  // 4-digit code she types to get in. Her birth year is a good one.
  gateCode: "1978",
  gateHints: [
    "The year the best mommy in the world was born.",
    "Hint: it starts with 19…",
    "Psst… it's 1978 😉"                     // shown after a few wrong tries
  ],

  /* ---------- PHOTOS — 5 total ---------------------------------------- */
  // 1) Her face for the arcade game — a close-up, cropped square, works best.
  faceImage: "photos/face.jpg",

  // 2–5) The 4 photos she unlocks by winning the arcade game.
  photos: [
    { src: "photos/IMG_8027.jpg", caption: "date night" },
    { src: "photos/IMG_8026.jpg", caption: "family movie night" },
    { src: "photos/IMG_8279.jpg", caption: "that smile" },
    { src: "photos/image1.jpg",   caption: "still the best team" }
  ],

  /* ---------- BOOTH 2 · STARGAZING TENT ------------------------------- */
  // One memory per constellation (heart, letter M, star).
  memories: [
    { title: "The Heart", text: "For every time you stayed up late just to make sure I got home safe." },
    { title: "The M",     text: "M is for Mommy — and for all the meals, the hugs, and the million little things you never asked thanks for." },
    { title: "The Star",  text: "You're the star that guides our whole family home." }
  ],

  /* ---------- BOOTH 4 · CLAW MACHINE ---------------------------------- */
  // Messages from the family. Optional: audio: "audio/tita.mp3"
  // One capsule per message.
  familyMessages: [
    { from: "Daddy",     text: "Happy birthday to the boss of the house. Love you always." },
    { from: "Bog",       text: "Happy birthday, Mommy! Thank you for everything. Love you always!" },
    { from: "Cream 🐱",  text: "Meow meow, meow. (Translation: happy birthday to my favorite human. Extra treats today, please.)" }
  ],

  /* ---------- BOOTH 5 · SCRATCH-OFF STAND ----------------------------- */
  coupons: [
    { prize: "Breakfast in bed",          fine: "redeemable any morning you like" },
    { prize: "1 full-body massage",       fine: "no time limit · no complaints" },
    { prize: "No dishes for a week",      fine: "I wash, you rest" },
    { prize: "A movie date, my treat",    fine: "you pick the movie, I buy the popcorn" }
  ],
  jackpot: { prize: "JACKPOT!", fine: "Your real gift is waiting in the Big Tent 🎁" },

  /* ---------- BOOTH 6 · TRIVIA WHEEL ---------------------------------- */
  // Each spin lands on a question. answer = the right option's number,
  // counting from 0 — or "any" if every option is right.
  quiz: [
    { label: "Cream",
      q: "Who is Cream's favorite human?",
      options: ["Bog", "Daddy", "Mommy, obviously"], answer: 2,
      yay: "Correct! Cream says meow (that means yes)." },
    { label: "Best",
      q: "Who is the best mommy in the whole world?",
      options: ["You", "You!", "Definitely you"], answer: "any",
      yay: "Trick question, every answer is right 💛" },
    { label: "Kids",
      q: "Who are your favorite kids?",
      options: ["The neighbor's kids", "Your two kids, of course", "Cream counts too"], answer: 1,
      yay: "We knew it! (Cream is a close third.)" },
    { label: "Love",
      q: "How much do we love you?",
      options: ["A little", "A lot", "More than Cream loves food"], answer: 2,
      yay: "That's a LOT of love." }
  ],

  /* ---------- BOOTH 7 · THE BIG TENT (finale) ------------------------- */
  letter: [
    "Dear Mommy,",
    "Happy 48th birthday, Ma!! Ok so yes, I made this whole carnival for you. It took me a while haha but you're worth every single minute of it.",
    "I'm not really good at saying this out loud kasi nahihiya ako, so I'm writing it here instead. Thank you. For waking up early even when you're tired, for always making sure we've eaten, for every \"ingat ka\" before I leave the house. I don't always answer properly but I always hear it, Ma.",
    "I'm sorry for the times I was makulit or moody, or when you asked for help and I said \"mamaya na.\" Even on those days you never stopped taking care of me. I notice it more now that I'm older.",
    "While I was making this I found our old movie night pictures and I just sat there smiling. You looked so happy. I want to give you more days like that, a lot more.",
    "The song playing right now is about saying everything you feel like it might be your last chance. I don't ever want to wait for a last chance with you, so I'm saying it now while it's playing: you are the best mommy in the world and I'm so lucky you're mine.",
    "I promise to help more without you having to ask twice, to be more patient with you, and to make you proud. Someday ako naman ang mag-aalaga sa'yo.",
    "Daddy, Bog, and even Cream agree that our house wouldn't be home without you. (Cream won't admit it unless there's food involved.)",
    "Mahal na mahal kita, Mommy. 48 looks really good on you ❤️",
    "Forever your baby,"
  ],
  finalGift: "Your real gift is right behind you. Turn around! 💝"
};
