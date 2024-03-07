import {
  intro,
  outro,
  select,
  confirm,
  text,
  note,
  log,
  spinner,
} from "@clack/prompts";
import { create, insert, remove, search, searchVector } from "@orama/orama";

type emoji = {
  id: string;
  alt: string;
  emoji: string;
  emojiCodepoint: string;
  gBoardOrder: number;
  keywords: string[];
  category: string;
  subcategory: string;
  combinations: [
    {
      gStaticUrl: string;
      alt: string;
      leftEmoji: string;
      leftEmojiCodepoint: string;
      rightEmoji: string;
      rightEmojiCodepoint: string;
      date: string;
    },
  ];
};

type EmojiData = {
  knownSupportedEmoji: string[];
  data: {
    [id: string]: {
      alt: string;
      emoji: string;
      emojiCodepoint: string;
      gBoardOrder: number;
      keywords: string[];
      category: string;
      subcategory: string;
      combinations: [
        {
          gStaticUrl: string;
          alt: string;
          leftEmoji: string;
          leftEmojiCodepoint: string;
          rightEmoji: string;
          rightEmojiCodepoint: string;
          date: string;
        },
      ];
    };
  };
};

const emojiKitchenDataFile = Bun.file("results/emojimetadata.json");
const emojiKitchenData: EmojiData = JSON.parse(
  await emojiKitchenDataFile.text(),
);

const baseEmojis = await create({
  schema: {
    id: "string",
    alt: "string",
    emoji: "string",
    keywords: "string[]",
    category: "string",
    subcategory: "string",
  },
});

for (const id in emojiKitchenData.data) {
  const emoji: emoji = emojiKitchenData.data[id] as emoji;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await insert(baseEmojis, {
    id: id,
    alt: emoji.alt,
    emoji: emoji.emoji,
    keywords: emoji.keywords,
    category: emoji.category,
    subcategory: emoji.subcategory,
  });
}

async function searchBaseEmojis() {
  const searchTerm = await text({
    message: "What emoji would you like to search for?",
    placeholder: "Not sure",
    initialValue: "",
    validate(value) {
      if (value.length === 0) return `Value is required!`;
    },
  });

  const searchResult = await search(baseEmojis, {
    term: searchTerm as string,
  });

  let emojis: emoji[] = [];

  if (searchResult.hits.length !== 0) {
    for (const hit of searchResult.hits) {
      const emoji: emoji = emojiKitchenData.data[hit.id] as emoji;
      emoji.id = hit.id;
      emojis.push(emoji);
    }
  }

  for (const emoji of emojis) {
    note(
      `Emoji found: ${emoji.emoji} (id: ${emoji.id})\nCategory: ${emoji.category}\nSubcategory: ${emoji.subcategory}\nKeywords: ${emoji.keywords.join(", ")}`,
    );
  }
}

try {
  intro("Emoji Kitchen Tools");

  const menu = await select({
    message: "Pick an action.",
    options: [
      {
        value: "search",
        label: "Search for an emoji",
      },
    ],
  });

  if (menu === "search") {
    await searchBaseEmojis();
  }
} catch (error) {
  log.error("Error");
  console.error(error);
}
