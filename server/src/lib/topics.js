// Curated conversation topics, modelled on the "agree or disagree" / controversial-statement
// format used in real ESL speaking classes (British Council LearnEnglish, Cambridge English
// speaking exams, and typical B1-B2 coursebook discussion sections). Each starter is a
// debatable statement or question the agent can use to open the topic or steer back to it —
// not a script to read verbatim.

const TOPICS = {
  sports: {
    labelEs: "Deportes",
    title: "sport",
    starters: [
      "Professional athletes are paid far too much money.",
      "Watching sport is a waste of time — playing it is what actually matters.",
      "Countries shouldn't spend public money hosting events like the Olympics or the World Cup.",
      "Video games should be considered a real sport.",
      "Kids should be pushed harder to play competitive sport at school.",
    ],
  },
  politics: {
    labelEs: "Política",
    title: "politics",
    starters: [
      "Voting should be compulsory for every adult citizen.",
      "There should be a maximum age limit for politicians.",
      "Social media has made political debate worse, not better.",
      "Young people today aren't interested enough in politics.",
      "It's better to have a few strong leaders than endless coalition compromises.",
    ],
  },
  finance: {
    labelEs: "Finanzas",
    title: "money, work, and the economy",
    starters: [
      "Working from home is bad for the economy in the long run.",
      "A four-day work week should become the standard everywhere.",
      "Cryptocurrency is more risk than opportunity for ordinary people.",
      "The rich should be taxed much more heavily than they are now.",
      "Owning a home is no longer a realistic goal for most young people, and that's fine.",
    ],
  },
  culture: {
    labelEs: "Cultura",
    title: "culture and traditions",
    starters: [
      "Traditions and customs matter less with every generation, and that's a real loss.",
      "Streaming has killed cinema as a shared cultural experience.",
      "Learning about other cultures from books and films is as valuable as travelling to see them.",
      "Museums should return artefacts to the countries they originally came from.",
      "Modern art is often overrated compared to classical art.",
    ],
  },
  technology: {
    labelEs: "Tecnología",
    title: "technology",
    starters: [
      "Artificial intelligence will do more harm than good to society overall.",
      "Children spend far too much time on screens.",
      "Social media does more damage to mental health than good.",
      "Self-driving cars will make roads safer than human drivers ever could.",
      "We rely on smartphones so much that we're losing basic skills.",
    ],
  },
  environment: {
    labelEs: "Medio ambiente",
    title: "the environment",
    starters: [
      "Individuals can't really make a difference on climate change — only governments and big companies can.",
      "Flying should be taxed much more heavily because of its environmental impact.",
      "Nuclear power is the only realistic way to cut emissions fast enough.",
      "Most people say they care about the environment but aren't willing to change their lifestyle.",
    ],
  },
  travel: {
    labelEs: "Viajes",
    title: "travel",
    starters: [
      "Tourism does more harm than good to most popular destinations.",
      "It's better to visit fewer places properly than many places quickly.",
      "Package holidays are a lazy way to travel.",
      "You can't really understand a country unless you learn the language.",
    ],
  },
  work: {
    labelEs: "Trabajo",
    title: "work and career",
    starters: [
      "A job you dislike but that pays well is better than one you love that pays poorly.",
      "Artificial intelligence will take away more jobs than it creates.",
      "Ambition matters more than talent when it comes to career success.",
      "Company loyalty is a thing of the past, and that's not necessarily bad.",
    ],
  },
};

export function getTopic(id) {
  if (!id) return undefined;
  return TOPICS[id];
}

export const TOPIC_LIST = Object.entries(TOPICS).map(([id, t]) => ({
  id,
  labelEs: t.labelEs,
}));
