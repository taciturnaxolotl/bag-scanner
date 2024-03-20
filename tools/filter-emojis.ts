import { intro, outro, text, note, log, spinner } from "@clack/prompts";

async function getEmojis() {
    const response = await fetch(
        `https://slack.com/api/emoji.list?pretty=1`,
        {
            headers: {
                Authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
            },
        },
    );

    return response.json();
}

intro("Filter Emojis");

const emojiSpinner = spinner();
emojiSpinner.start("Fetching emojis...");
const emojis = await getEmojis();
emojiSpinner.stop("Emojis fetched!");

const filter = await text({
    message: "Enter the name of the emoji you would like to search for:",
    placeholder: "Not sure",
    initialValue: "",
    validate(value) {
        if (value.length === 0) return `Value is required!`;
    },
});

let filteredEmojis;
// if filter starts with /, treat it as a regex
if ((filter as string).startsWith("/")) {
    log.info(`Filtering emojis by regex: ${(filter as string).slice(1)}`);
    // filter the emojis by regex match if a regex is provided
    filteredEmojis = Object.entries(emojis.emoji).filter(([name]) => {
        const regex = new RegExp((filter as string).slice(1), "i");
        return regex.test(name);
    });
} else {
    log.info(`Filtering emojis by name: ${filter as string}`);
    // filter the emojis by name if a string is provided
    filteredEmojis = Object.entries(emojis.emoji).filter(([name]) => {
        return name.includes(filter as string);
    });
}


if (filteredEmojis && filteredEmojis.length === 0) {
    log.warn(`No emojis found with the name ${String(filter)}.`);
}

const filteredEmojisList = filteredEmojis.map(([name, url]) => {
    return `":${name}:"`;
});

note(`Found ${filteredEmojis.length} emojis with the filter ${filter as string}.`);
log.info(`[${filteredEmojisList.join(", ")}]`);

outro("Bye!");