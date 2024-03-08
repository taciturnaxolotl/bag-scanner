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
  } else {
    log.error("No emojis found");
  }

  for (const emoji of emojis) {
    note(
      `Emoji found: ${emoji.emoji} (id: ${emoji.id})\nCategory: ${emoji.category}\nSubcategory: ${emoji.subcategory}\nKeywords: ${emoji.keywords.join(", ")}`,
    );
  }

  if (emojis.length > 0) {
    const nextAction = await select({
      message: "What would you like to do next?",
      options: [
        {
          value: "search-base",
          label: "Search for another base emoji",
        },
        {
          value: "search-combination",
          label: "Search for emoji combinations",
        },
        {
          value: "exit",
          label: "Exit",
        },
      ],
    });

    if (nextAction === "search-base") {
      await searchBaseEmojis();
    } else if (nextAction === "search-combination") {
      await searchCombinations(emojis);
    }
  } else {
    const nextAction = await select({
      message: "What would you like to do next?",
      options: [
        {
          value: "search-base",
          label: "Search for another base emoji",
        },
        {
          value: "exit",
          label: "Exit",
        },
      ],
    });

    if (nextAction === "search-base") {
      await searchBaseEmojis();
    }
  }
}

async function searchCombinations(baseEmojis: emoji[]) {
  let searchEmoji: string;

  if (baseEmojis.length > 1) {
    searchEmoji = (await select({
      message: "Which emoji would you like to search for?",
      options: baseEmojis.map((emoji) => ({
        value: emoji.id,
        label: emoji.emoji,
      })),
    })) as string;
  } else {
    log.info(
      "Only one emoji found, searching for combinations with that emoji",
    );
    searchEmoji = baseEmojis[0].id;
  }

  const addingEmojis = spinner();

  addingEmojis.start("Adding emojis to search vector");

  const combinationEmojis = await create({
    schema: {
      name: "string",
      leftEmoji: "string",
      rightEmoji: "string",
    },
  });

  for (const combinationEmoji of emojiKitchenData.data[searchEmoji]
    .combinations) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await insert(combinationEmojis, {
      name: combinationEmoji.alt,
      leftEmoji: combinationEmoji.leftEmoji,
      rightEmoji: combinationEmoji.rightEmoji,
    });
  }

  addingEmojis.stop("Emojis added to search vector");

  const searchTerm = await text({
    message: "What combination emoji would you like to search for?",
    placeholder: "Not sure",
    initialValue: "",
    validate(value) {
      if (value.length === 0) return `Value is required!`;
    },
  });

  const searchResult = await search(combinationEmojis, {
    term: searchTerm as string,
  });

  if (searchResult.hits.length !== 0) {
    for (const hit of searchResult.hits) {
      note(
        `Combination Emoji found: ${hit.document.name}\nleft emoji: ${hit.document.leftEmoji}\nright emoji: ${hit.document.rightEmoji}`,
      );
    }
  } else {
    log.error("No emojis found");
  }

  const nextAction = await select({
    message: "What would you like to do next?",
    options: [
      {
        value: "search-combination",
        label: "Search for another emoji combination",
      },
      {
        value: "search-base",
        label: "Search for another emoji base",
      },
      {
        value: "exit",
        label: "Exit",
      },
    ],
  });

  if (nextAction === "search-base") {
    await searchBaseEmojis();
  } else if (nextAction === "search-combination") {
    await searchCombinations(baseEmojis);
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

  outro("Goodbye!");
} catch (error) {
  log.error("Error");
  console.error(error);
}
