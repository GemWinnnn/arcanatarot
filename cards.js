/* The 22 Major Arcana, matching the illustrated deck exported from Figma. */
const DECK = [
  {
    id: "the-fool", numeral: "0", name: "The Fool",
    lens: {
      love: "A connection with no map — the beginning where you know nothing about how it ends and want it anyway.",
      work: "The unqualified leap: the role you have not done before, the pitch you have no business making, the door you knock on regardless.",
      money: "Untested ground — a risk that is genuinely a risk, rather than a sure thing wearing a disguise.",
      growth: "Beginner's mind, handed back to you on purpose. You are allowed to be new at this.",
      choice: "The option that cannot be researched into safety. Take the one that makes you feel awake."
    },
    up: {
      keys: ["Beginnings", "Innocence", "A leap of faith"],
      body: "Something in you is standing at the edge with a light bag and a lighter heart. The Fool is the moment before experience — the road unwalked, the question unasked. You are being invited to begin before you feel ready, because readiness was never the requirement.",
      whisper: "Step. The ground arrives underfoot."
    },
    rev: {
      keys: ["Hesitation", "Recklessness", "Fear of the first step"],
      body: "Either you are frozen at the threshold, rehearsing every version of the fall, or you are running so fast you have stopped looking down. Reversed, The Fool asks which one it is — and reminds you that caution and courage are not opposites, only companions.",
      whisper: "Look before you leap. Then leap."
    }
  },
  {
    id: "the-magician", numeral: "I", name: "The Magician",
    lens: {
      love: "You have far more agency here than you have been using. Say the direct thing, in your own words, first.",
      work: "The skill is already in your hands; this is about applying it with focus rather than collecting more of it.",
      money: "Resourcefulness over luck — what you already own can be turned into what you need.",
      growth: "Will, aimed. The practice becomes powerful on the day it becomes daily.",
      choice: "Choose the option you can actually execute. Capability is the deciding factor, not appeal."
    },
    up: {
      keys: ["Will", "Manifestation", "Resourcefulness"],
      body: "Everything you need is already on the table. The Magician is the intelligence that turns intention into action — focus narrowed to a point until the world bends around it. What you have been calling luck is mostly attention applied without flinching.",
      whisper: "As above, so below. Begin the work."
    },
    rev: {
      keys: ["Scattered focus", "Untapped talent", "Illusion"],
      body: "The tools are laid out and untouched, or they are being used for a trick rather than a craft. Reversed, The Magician points at the gap between what you can do and what you are doing — and asks you to close it honestly.",
      whisper: "Power without direction is only noise."
    }
  },
  {
    id: "the-high-priestess", numeral: "II", name: "The High Priestess",
    lens: {
      love: "What is unspoken between you is louder than what is said, and you already sense which way it points.",
      work: "Watch before you move. The politics of this room are legible if you stay quiet a while longer.",
      money: "Do not decide from urgency. Sit with the numbers until your gut and the spreadsheet say the same thing.",
      growth: "The real work is happening below the waterline. Trust it without demanding evidence.",
      choice: "Sleep on it. This answer arrives on its own rather than being argued into place."
    },
    up: {
      keys: ["Intuition", "Mystery", "Inner knowing"],
      body: "She sits between the pillars and says nothing, because the answer is not out here. You already know the thing you keep asking other people about. The High Priestess counsels stillness — the kind that lets the sediment settle so you can see through the water.",
      whisper: "Be quiet enough to hear yourself."
    },
    rev: {
      keys: ["Secrets", "Ignored instinct", "Disconnection"],
      body: "A knowing has been overruled — by logic, by other voices, by the wish for it to be otherwise. Reversed, she notes what is being withheld, whether by someone else or by you from yourself.",
      whisper: "The voice you dismissed was right."
    }
  },
  {
    id: "the-empress", numeral: "III", name: "The Empress",
    lens: {
      love: "Warmth and slow tending — the kind of love that feels like a home rather than an audition.",
      work: "Creative work flourishes here. Nurture the project and the people on it instead of driving them harder.",
      money: "Abundance grows out of what is already growing. Reinvest rather than chase.",
      growth: "Rest, pleasure and the body are not indulgences in this reading; they are the method.",
      choice: "Choose what you can genuinely nourish, not what merely flatters you."
    },
    up: {
      keys: ["Abundance", "Nurture", "Creation"],
      body: "Growth that cannot be rushed is still growth. The Empress is fertile ground, soft power, and the generosity that comes from being genuinely full. Tend what you love — a project, a person, a body — and let it be beautiful without apology.",
      whisper: "Bloom where you are being watered."
    },
    rev: {
      keys: ["Depletion", "Smothering", "Creative block"],
      body: "You are pouring from a vessel nobody has refilled, or holding something so tightly it cannot grow. Reversed, The Empress turns the care outward-facing care back toward you.",
      whisper: "You are also the garden."
    }
  },
  {
    id: "the-emperor", numeral: "IV", name: "The Emperor",
    lens: {
      love: "This asks for structure rather than more feeling — stated terms, kept promises, a clear shape.",
      work: "Take ownership. Set the standard and defend it; the ambiguity is what is costing you.",
      money: "Budget, boundary, plan. The discipline you install now is what buys freedom later.",
      growth: "Build scaffolding — routines you keep on the days you do not feel like keeping them.",
      choice: "Decide, then hold the decision still long enough for it to actually work."
    },
    up: {
      keys: ["Structure", "Authority", "Discipline"],
      body: "Freedom without form dissipates. The Emperor builds the walls that make a room — boundaries, routines, decisions made once so they need not be made daily. Claim the chair. Someone has to govern this, and it may as well be you.",
      whisper: "Order is a kind of kindness."
    },
    rev: {
      keys: ["Rigidity", "Control", "Absent leadership"],
      body: "The structure has become a cage, or there is no structure at all and everyone is waiting for someone to decide. Reversed, The Emperor asks whether your rules still serve the thing they were built to protect.",
      whisper: "Hold the line, not the leash."
    }
  },
  {
    id: "the-hierophant", numeral: "V", name: "The Hierophant",
    lens: {
      love: "Shared values and the practical question underneath the romance: do you want the same life?",
      work: "Mentorship, credentials, and the institution's way of doing things. Learn the rules properly before breaking them.",
      money: "Conventional, tested approaches will outperform clever ones in this matter.",
      growth: "Study with someone who has walked further down this road than you have.",
      choice: "Ask what the wisest person you know would do — then weigh their answer honestly."
    },
    up: {
      keys: ["Tradition", "Guidance", "Belonging"],
      body: "There is an older path here, worn smooth by people who went first. The Hierophant points to mentorship, study, ritual, and the quiet strength of belonging to something larger than the week you are having.",
      whisper: "Ask the ones who came before."
    },
    rev: {
      keys: ["Nonconformity", "Dogma", "Your own path"],
      body: "The teaching no longer fits the student. Reversed, The Hierophant blesses the departure — from the institution, the inherited belief, the way it has always been done.",
      whisper: "Keep the wisdom. Leave the rulebook."
    }
  },
  {
    id: "the-lovers", numeral: "VI", name: "The Lovers",
    lens: {
      love: "The real question is alignment: do you want the same things, or only each other?",
      work: "A partnership, or a fork in the road. Choose from your values rather than from your fear.",
      money: "A shared commitment or joint decision — make sure both parties are being fully honest about it.",
      growth: "Integration. The two halves of you that keep arguing turn out to want the same thing.",
      choice: "This is the card of choosing. Take the one you would choose again on a bad day."
    },
    up: {
      keys: ["Union", "Choice", "Alignment"],
      body: "More than romance: this is the card of choosing with your whole self, values and desire pointing the same direction. Where two things meet — people, paths, halves of you — something is being decided in favour of wholeness.",
      whisper: "Choose what you would choose again."
    },
    rev: {
      keys: ["Discord", "Avoidance", "Values misaligned"],
      body: "Something is out of tune: what you say you want and what you keep choosing. Reversed, The Lovers pulls the decision back into the light rather than letting it be made by default.",
      whisper: "Not deciding is deciding."
    }
  },
  {
    id: "the-chariot", numeral: "VII", name: "The Chariot",
    lens: {
      love: "Pursue it deliberately or stop pursuing it. The drift is what is doing the damage.",
      work: "Real momentum is available the moment you pick one objective and drive it.",
      money: "Direction plus discipline. The plan works if you stop rewriting it every month.",
      growth: "Self-mastery through motion — those opposing impulses steer far better than they stall.",
      choice: "Pick the direction you can commit to for the whole distance, not just the first mile."
    },
    up: {
      keys: ["Momentum", "Willpower", "Victory"],
      body: "Two forces that want to pull apart, held together by your grip and your nerve. The Chariot is forward motion earned through control — not the absence of opposing impulses, but the mastery of them.",
      whisper: "Take the reins. Name the direction."
    },
    rev: {
      keys: ["Stalling", "Scattered drive", "Losing the thread"],
      body: "The horses are going their own ways. Reversed, The Chariot points to effort spent in every direction at once — and asks for one destination, chosen out loud.",
      whisper: "Speed is not the same as progress."
    }
  },
  {
    id: "strength", numeral: "VIII", name: "Strength",
    lens: {
      love: "Patience and gentleness will accomplish here what pressure never could.",
      work: "Endurance over force. Steady competence is being noticed, even if slowly and quietly.",
      money: "Hold your nerve. This is a long game, not a rescue.",
      growth: "Befriend the part of yourself you have been trying to defeat.",
      choice: "Choose the option that asks for courage but not for cruelty."
    },
    up: {
      keys: ["Courage", "Patience", "Gentle power"],
      body: "The lion is not beaten; it is befriended. Strength is the soft hand on the wild thing — your fear, your temper, your hunger — steady enough that force becomes unnecessary. This is endurance with grace in it.",
      whisper: "Gentleness is the stronger grip."
    },
    rev: {
      keys: ["Self-doubt", "Burnout", "Forced control"],
      body: "You are gritting your teeth where you might have opened your hand. Reversed, Strength names the exhaustion of holding it all together and suggests the courage of admitting it.",
      whisper: "Softness is not surrender."
    }
  },
  {
    id: "the-hermit", numeral: "IX", name: "The Hermit",
    lens: {
      love: "Space is the answer for now — whether that means solitude or simply a quieter kind of closeness.",
      work: "Step back from the noise. The strategic answer needs depth, not another meeting.",
      money: "Simplify. Fewer commitments, each one examined honestly.",
      growth: "This is a season for going inward rather than outward, and it will not last forever.",
      choice: "Do not decide in company. Take the question somewhere quiet and ask it again."
    },
    up: {
      keys: ["Solitude", "Reflection", "Inner light"],
      body: "A step back from the noise, taken on purpose. The Hermit carries a small lamp — just enough light for the next stretch of path. Answers are coming, but they arrive in silence and at their own pace.",
      whisper: "Go inward. Bring a lantern."
    },
    rev: {
      keys: ["Isolation", "Avoidance", "Coming back"],
      body: "Retreat has curdled into hiding, or the withdrawal has lasted long enough. Reversed, The Hermit signals the return — the lamp is for the road, not the cave.",
      whisper: "Solitude ends when it stops teaching."
    }
  },
  {
    id: "wheel-of-fortune", numeral: "X", name: "Wheel of Fortune",
    lens: {
      love: "Timing is doing most of the work here. Something is turning whether or not you push it.",
      work: "A change of circumstance is on its way. Position yourself rather than plan too precisely.",
      money: "Fortunes move. Do not treat the current number as permanent in either direction.",
      growth: "You have been at this exact point in the cycle before. What differs is what you do here.",
      choice: "Wait one turn. The situation will look materially different very soon."
    },
    up: {
      keys: ["Change", "Cycles", "Fate turning"],
      body: "The wheel moves whether or not you are ready, and it is moving now. Luck, timing, and the long arc of consequence are all in play. What has been stuck is about to be unstuck, in a direction you did not plan.",
      whisper: "The turn is already happening."
    },
    rev: {
      keys: ["Resistance", "Bad timing", "Repeating patterns"],
      body: "The same corner keeps coming around because the wheel is going in circles rather than forward. Reversed, it asks what you keep doing at exactly this point in the loop.",
      whisper: "You cannot stop the wheel. Only your grip."
    }
  },
  {
    id: "justice", numeral: "XI", name: "Justice",
    lens: {
      love: "Fairness and honest accounting. Say the true thing, even where it costs you something.",
      work: "Contracts, credit and consequence. Get it in writing and be scrupulous about your own part.",
      money: "Balance the books literally. The truth of the numbers is itself the guidance.",
      growth: "Take responsibility for your share without quietly absorbing everyone else's.",
      choice: "Weigh it properly, then let the fairest option win even when it is not the easiest."
    },
    up: {
      keys: ["Truth", "Balance", "Consequence"],
      body: "The scales are honest and they are not sentimental. Justice concerns cause and effect, accountability, and the clarity that comes when you finally weigh a thing properly. Fairness here includes being fair to yourself.",
      whisper: "Tell the truth and let it settle."
    },
    rev: {
      keys: ["Imbalance", "Evasion", "Unfairness"],
      body: "Something has not been reckoned with — an accounting deferred, a bias unexamined, a wrong left unnamed. Reversed, Justice waits, and it is patient.",
      whisper: "The bill does not disappear."
    }
  },
  {
    id: "the-hanged-man", numeral: "XII", name: "The Hanged Man",
    lens: {
      love: "Nothing here can be forced. The situation needs a different angle, not more effort.",
      work: "A pause, a delay, or a reversal of roles. Use the suspension to see the thing freshly.",
      money: "Not the moment to move money. Let the position sit exactly where it is.",
      growth: "Surrender the outcome and watch carefully what your mind does with the empty space.",
      choice: "Do not choose yet. Hang here until the question itself changes shape."
    },
    up: {
      keys: ["Pause", "New perspective", "Surrender"],
      body: "Suspended, and strangely at peace. The Hanged Man is the deliberate pause — the willingness to hang upside down until the world rearranges itself into sense. Nothing is being wasted in this waiting.",
      whisper: "Stop pushing. Start seeing."
    },
    rev: {
      keys: ["Stalling", "Martyrdom", "Needless delay"],
      body: "The pause has become a posture. Reversed, this card distinguishes between the sacrifice that transforms and the one that merely costs.",
      whisper: "Suffering is not the same as insight."
    }
  },
  {
    id: "death", numeral: "XIII", name: "Death",
    lens: {
      love: "Something in this genuinely has to end — a dynamic, an expectation, or the old form of the thing.",
      work: "The role you have outgrown is finished. Let the ending be clean rather than dragged.",
      money: "Close the chapter. The sunk cost is not an argument, it is only a feeling.",
      growth: "The version of you who started this does not have to be the one who finishes it.",
      choice: "Choose the ending. What you are protecting has already left the building."
    },
    up: {
      keys: ["Endings", "Transformation", "Release"],
      body: "Rarely literal, always thorough. Death closes a chapter completely so the next one can begin unhaunted — an identity, a role, a relationship to your own past. What is leaving was already leaving; this is the permission.",
      whisper: "Let it end. Something is waiting."
    },
    rev: {
      keys: ["Clinging", "Stalled change", "Fear of ending"],
      body: "You are keeping something alive on your own breath. Reversed, Death is the drawn-out goodbye — and the quiet suggestion that the hardest part is the holding on, not the letting go.",
      whisper: "Nothing grows in a closed hand."
    }
  },
  {
    id: "temperance", numeral: "XIV", name: "Temperance",
    lens: {
      love: "Two lives blending slowly. Patience is what makes it a third thing rather than a compromise.",
      work: "Moderate the pace. Sustainable will beat heroic over the distance this needs.",
      money: "The middle path — gradual, balanced, no extremes in either direction.",
      growth: "Small consistent doses. The transformation here is chemical, not dramatic.",
      choice: "Neither extreme. There is a blended option you have not named out loud yet."
    },
    up: {
      keys: ["Balance", "Patience", "Alchemy"],
      body: "Two things poured slowly into one another until they become a third thing entirely. Temperance is moderation as an art form — the middle path, the right dose, the long simmer that no amount of heat can shorten.",
      whisper: "Blend it slowly. Let it become."
    },
    rev: {
      keys: ["Excess", "Impatience", "Discord"],
      body: "Too much of one thing, too fast. Reversed, Temperance names the overcorrection — and asks you to find the measure again before the mixture spoils.",
      whisper: "Haste burns the alchemy."
    }
  },
  {
    id: "the-devil", numeral: "XV", name: "The Devil",
    lens: {
      love: "Look honestly at what binds you here: attraction, habit, fear, or genuine choice.",
      work: "The golden handcuffs are still handcuffs. Name what this job actually costs you.",
      money: "Debt, dependency, or a pattern of spending that is quietly soothing something else.",
      growth: "The shadow is asking to be acknowledged, not exiled.",
      choice: "Check whether you are choosing at all, or merely obeying a very old habit."
    },
    up: {
      keys: ["Attachment", "Shadow", "Temptation"],
      body: "The chains in this card are loose enough to lift off. The Devil is whatever you have agreed to be bound by — a habit, a story about yourself, a comfort that costs more than it gives. Naming it honestly is most of the work.",
      whisper: "See the chain. Notice it is not locked."
    },
    rev: {
      keys: ["Release", "Awareness", "Breaking free"],
      body: "The spell is thinning. Reversed, The Devil is the moment the hold weakens — clear sight arriving, the grip loosening, freedom starting to look possible rather than theoretical.",
      whisper: "You are allowed to walk away."
    }
  },
  {
    id: "the-tower", numeral: "XVI", name: "The Tower",
    lens: {
      love: "A truth is going to surface, and the structure built around avoiding it will not survive it.",
      work: "Sudden change — a restructure, an exit, an upheaval. Better to move first than be moved.",
      money: "Brace for the unexpected cost, and stop building on the assumption you know is shaky.",
      growth: "A belief about yourself is due to collapse. Let it, and stand in what remains.",
      choice: "The safe option is not safe. Choose with the collapse already priced in."
    },
    up: {
      keys: ["Upheaval", "Revelation", "Sudden truth"],
      body: "Lightning finds the thing built on a false foundation. The Tower is abrupt, unasked-for, and clarifying — the collapse of a structure that was never going to hold. Painful, and on the other side of it, honest ground.",
      whisper: "What falls now could not have stood."
    },
    rev: {
      keys: ["Averted disaster", "Fear of change", "Slow collapse"],
      body: "You may be bracing for a fall, or delaying one that is due. Reversed, The Tower suggests dismantling it yourself, deliberately, before the weather does it for you.",
      whisper: "Take it down before it takes you down."
    }
  },
  {
    id: "the-star", numeral: "XVII", name: "The Star",
    lens: {
      love: "Gentle repair, renewed hope, and the relief of being seen without armour on.",
      work: "The recovery after a hard stretch. Keep going, quietly, in the same direction.",
      money: "Slow replenishment. The worst of this is already behind you.",
      growth: "Healing is underway. Do not interrupt it with self-judgement.",
      choice: "Choose what gives you hope over what merely protects you from disappointment."
    },
    up: {
      keys: ["Hope", "Healing", "Renewal"],
      body: "After the Tower, the sky clears. The Star is quiet faith restored — not fireworks, but the steady point of light that tells you which way is north. Something in you is beginning to mend, and it will keep mending.",
      whisper: "Look up. You are being guided."
    },
    rev: {
      keys: ["Discouragement", "Lost faith", "Fatigue"],
      body: "The light is still there; the cloud is between you and it. Reversed, The Star speaks to weariness and asks for rest rather than resolve.",
      whisper: "Hope is a practice, not a mood."
    }
  },
  {
    id: "the-moon", numeral: "XVIII", name: "The Moon",
    lens: {
      love: "Not everything you are being told is the whole truth — including the parts you tell yourself.",
      work: "Something is unclear or unspoken here. Get the facts before you act on the feeling.",
      money: "Do not commit to what you cannot see clearly. Read the fine print twice.",
      growth: "The fear is old. It is memory, not information about the present.",
      choice: "Too dark to choose. Ask a better question before you ask this one again."
    },
    up: {
      keys: ["Dreams", "Uncertainty", "The subconscious"],
      body: "Moonlight is beautiful and it is unreliable — everything half-lit, shapes that could be anything. The Moon is intuition and illusion tangled together, the fears that only come out at night, the truth arriving through dreams instead of daylight.",
      whisper: "Not everything you see is there."
    },
    rev: {
      keys: ["Clarity returning", "Confusion lifting", "Truth surfacing"],
      body: "The fog is burning off. Reversed, The Moon marks the point where anxiety separates itself from information and you can finally tell which was which.",
      whisper: "Dawn is doing its work."
    }
  },
  {
    id: "the-sun", numeral: "XIX", name: "The Sun",
    lens: {
      love: "Warmth without complication. This is the good one — enjoy it out loud.",
      work: "Visibility, success and credit arriving. Say yes, and let it be seen.",
      money: "Genuine improvement. The number is moving in the right direction.",
      growth: "You are more well than you think you are. Let yourself feel it.",
      choice: "Choose the option that makes you feel most like yourself in daylight."
    },
    up: {
      keys: ["Joy", "Vitality", "Success"],
      body: "Uncomplicated good. The Sun is warmth without a catch — clarity, confidence, and the particular happiness of being fully seen and unbothered by it. Whatever you have been working toward is lit up and going well.",
      whisper: "Stand in it. You have earned the light."
    },
    rev: {
      keys: ["Dimmed joy", "Delay", "Clouded confidence"],
      body: "The sun has not gone anywhere; something is in front of it. Reversed, this card points at temporary shade — self-doubt, a postponement, a joy you are not letting yourself feel.",
      whisper: "The light is still yours."
    }
  },
  {
    id: "judgement", numeral: "XX", name: "Judgement",
    lens: {
      love: "An honest reckoning, a second chance, or a conversation you have been sending to voicemail.",
      work: "The larger calling is louder than the safe role. Answer it before it stops calling.",
      money: "Review everything honestly — then actually act on what the review tells you.",
      growth: "Forgive the older version of yourself and let them put the weight down.",
      choice: "You already know. This is about answering, not about deciding."
    },
    up: {
      keys: ["Reckoning", "Awakening", "The call"],
      body: "A trumpet, and everything you have done arranged in front of you without commentary. Judgement is the honest review — and the calling that follows it. Something is summoning you toward a larger version of your life.",
      whisper: "Answer it. You already heard it."
    },
    rev: {
      keys: ["Self-criticism", "Ignoring the call", "Doubt"],
      body: "The review has turned into a prosecution, or the call keeps being sent to voicemail. Reversed, Judgement asks for the harder thing: forgiveness of yourself, and then movement.",
      whisper: "Be your witness, not your judge."
    }
  },
  {
    id: "the-world", numeral: "XXI", name: "The World",
    lens: {
      love: "Completion and wholeness — a relationship that has finally become itself.",
      work: "The long project closes. Take the credit, and the breath, before the next thing starts.",
      money: "A cycle finishes: the goal reached, the debt cleared, the account settled.",
      growth: "Integration. You have become the person you were trying to become.",
      choice: "Choose what completes something rather than what postpones it."
    },
    up: {
      keys: ["Completion", "Wholeness", "Arrival"],
      body: "The circle closes. The World is a genuine ending — the long thing finished, the lesson integrated, the version of you that started it now retired with honours. Take the full breath before the next beginning.",
      whisper: "It is complete. Let it be complete."
    },
    rev: {
      keys: ["Almost there", "Loose ends", "Delayed closure"],
      body: "One thread is still hanging and you can feel it. Reversed, The World points to the final small effort that turns nearly-finished into finished.",
      whisper: "Close the loop. Then rest."
    }
  }
];
