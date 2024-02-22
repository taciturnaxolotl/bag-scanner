const users: any = [];

async function getUsers(cursor = "") {
  const response = await fetch(
    `https://slack.com/api/users.list?cursor=${cursor}&pretty=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
      },
    },
  );

  return response.json();
}

async function getAllUsers() {
  let cursor = "";

  try {
    do {
      const response = await getUsers(cursor);
      users.push(...response.members);
      cursor = response.response_metadata.next_cursor;
      console.log(users);
      Bun.write("users.json", JSON.stringify(users));
    } while (cursor);

    console.log(users);
  } catch (error) {
    console.error(error);
  }
}

getAllUsers();
