const users = await Bun.file("users.json").text();

var array = JSON.parse(users);

// get number of total entries in the array

console.log("Total entries: " + array.length);

// remove duplicates from [{"id": "anid", "name": "aname", ...}, ...]

const uniqueIds = new Set();

// Deduplicate the array based on the 'id' property
const deduped = array.filter((item) => {
  if (!uniqueIds.has(item.id)) {
    console.log(`Adding ${item.id} to deduped array. #${array.indexOf(item)} of ${array.length}; ${array.indexOf(item) / array.length * 100}% done.`);
    uniqueIds.add(item.id);
    return true;
  } else {
    console.log(`Skipping ${item.id} from deduped array. #${array.indexOf(item)} of ${array.length}; ${array.indexOf(item) / array.length * 100}% done.`);
    return false;
  }
});

const users2 = Bun.write("users2.json", JSON.stringify(deduped));

console.log("Deduped users.json and written to users2.json.");
