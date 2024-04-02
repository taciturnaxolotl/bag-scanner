import { intro, outro, text, note, log } from "@clack/prompts";

async function getUser(UserID: string) {
  const response = await fetch(
    `https://slack.com/api/users.info?user=${UserID}&pretty=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
      },
    },
  );

  return response.json();
}

// ask user for the name of the user to get details for

intro("Get User Details");

const id = await text({
  message: "Enter the slack UserID you would like to search for:",
  placeholder: "Not sure",
  initialValue: "",
  validate(value) {
    if (value.length === 0) return `Value is required!`;
  },
}) as string;

// check for comma separated values
const ids = id.includes(",") ? id.split(",") : [id];

// strip any whitespace from the ids
ids.forEach((id, index) => {
  ids[index] = id.trim();
});

// get the user details for the user with the given name
// if the user is not found, return an error message
if (ids.length > 1) {
  for (const id of ids) {
    const user = await getUser(id);

    if (user.ok === false) {
      log.warn(`No user found with the id ${String(id)}.`);
    } else {
      note(`  ${user.user.profile.pronouns ? `${user.user.profile.pronouns} ${user.user.real_name}` : user.user.real_name}
  ---
  @${user.user.profile.display_name_normalized}
  email: ${user.user.profile.email ? user.user.profile.email : "No email provided"}
  phone: ${user.user.profile.phone.length > 0 ? user.user.profile.phone : "No phone number provided"}
  timezone: ${user.user.tz ? `${user.user.tz} - ${user.user.tz_label}` : "No timezone provided"}
  ${user.user.deleted ? "user.user has been deleted :(" : `User is active & ${user.user.is_admin ? (user.user.is_owner ? "User is an Admin and a owner" : "User is an Admin") : "User is not an admin"}`}
  ---`);
    }
  }
} else {
  const user = await getUser(id);

  if (user.ok === false) {
    log.warn(`No user found with the id ${String(id)}.`);
  } else {
    note(`  ${user.user.profile.pronouns ? `${user.user.profile.pronouns} ${user.user.real_name}` : user.user.real_name}
  ---
  @${user.user.profile.display_name_normalized}
  email: ${user.user.profile.email ? user.user.profile.email : "No email provided"}
  phone: ${user.user.profile.phone.length > 0 ? user.user.profile.phone : "No phone number provided"}
  timezone: ${user.user.tz ? `${user.user.tz} - ${user.user.tz_label}` : "No timezone provided"}
  ${user.user.deleted ? "user.user has been deleted :(" : `User is active & ${user.user.is_admin ? (user.user.is_owner ? "User is an Admin and a owner" : "User is an Admin") : "User is not an admin"}`}
  ---`);
}

outro("Bye!");
