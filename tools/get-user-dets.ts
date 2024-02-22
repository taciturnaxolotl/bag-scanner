import { intro, outro, text, note, log } from '@clack/prompts';

const info = await Bun.file("users.json").text();

var array = JSON.parse(info);

// ask user for the name of the user to get details for

intro("Get User Details");

const name = await text({
  message: 'What is the name you would like to search for?',
  placeholder: 'Not sure',
  initialValue: '',
  validate(value) {
    if (value.length === 0) return `Value is required!`;
  },
});

// get the user details for the user with the given name
// if the user is not found, return an error message
const users = array.filter((user: any) => user.name.toLowerCase().includes((name as string).toLowerCase()));

if (users.length === 0) {
  log.warn(`No user found with the name ${String(name)}.`);
} else {
  for (const user of users) {
    log.info(`User found: ${user.real_name}`);
    note(`@${user.name}
email: ${user.profile.email ? user.profile.email : "No email provided"}
phone: ${(user.profile.phone).length > 0 ? user.profile.phone : "No phone number provided"}
timezone: ${user.tz ? user.tz : "No timezone provided"}
${user.deleted ? "User has been deleted :(" : "User is active :)"}
${user.is_admin ? (user.is_owner ? "User is an Admin and a owner" : "User is an Admin") : "User is not an admin"}`)
  }
}

outro("Bye!");
