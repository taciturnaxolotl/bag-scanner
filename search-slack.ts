import {
  intro,
  outro,
  text,
  note,
  log,
  spinner,
  confirm,
} from "@clack/prompts";
import { BunFile } from "bun";

async function searchAPI(query: string, page: number) {
  const response = await fetch(
    `https://slack.com/api/search.messages?query=${encodeURIComponent(query)}&page=${page}&pretty=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_USER_TOKEN}`,
      },
    },
  );

  return response.json();
}

async function search(query: string) {
  // handle pagination
  let page = 1;
  let messages: any[] = [];
  let totalPages = 0;
  let rateLimitCount = 0;

  const spinnerSearch = spinner();

  log.info(
    "Web API Tier 2 so setting Rate Limit timeout to increments of 10s and waiting 3s between each query.",
  );

  spinnerSearch.start("Searching...");

  try {
    do {
      const response = await searchAPI(query, page);

      // handle errors
      if (response.ok === false) {
        log.error(response.error);

        if (response.error === "ratelimited") {
          rateLimitCount++;
          for (let i = 10 * rateLimitCount; i > 0; i--) {
            spinnerSearch.message(`Rate limited. Waiting for ${i} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          log.success("Rate limit lifted. Resuming search...");
          continue;
        }

        spinnerSearch.stop("Error!");

        throw new Error(response.error);
      }

      messages.push(...response.messages.matches);

      spinnerSearch.message(
        `Searching... Page ${page} of ${response.messages.paging.pages}`,
      );

      totalPages = response.messages.paging.pages;
      page++;

      await new Promise((resolve) => setTimeout(resolve, 3000));
    } while (page <= totalPages);
  } catch (error) {
    // catch rate limit errors
    spinnerSearch.stop("Error!");

    console.error(error);

    return;
  }

  spinnerSearch.stop("Done!");

  return messages;
}

// ask user for the name of the user to get details for

intro("Search Slack Programatically!");

const query = await text({
  message: "Enter the query you want to search for:",
  initialValue: "",
  validate(value) {
    if (value.length === 0) return `Value is required!`;
  },
});

const saveToFile = await confirm({
  message: "Would you like to save the results to a file?",
});
let fileName: BunFile | undefined;
if (saveToFile) {
  fileName = Bun.file(
    (await text({
      message: "Enter the name of the file to save the results to:",
      initialValue: "search-results.json",
    })) as string,
  );
} else {
  log.warn("Results will not be saved to a file.");
}

// get the user details for the user with the given name
// if the user is not found, return an error message
const results = await search(query as string);
if (!results) {
} else if (results.length === 0) {
  log.warn(`No results found for the query ${String(query)}.`);
} else {
  note(`  ${results.length} results found for the query ${String(query)}.`);

  if (fileName) {
    Bun.write(fileName, results);
    log.info(`Results saved to ${fileName}.json`);
  }
}

outro("Bye!");
