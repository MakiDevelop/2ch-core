import "dotenv/config";
import { createPost, listPosts } from "../agents/persistence/postgres";

async function main() {
  console.log("Inserting post...");
  await createPost({
    content: "Hello 2ch.tw 👋 這是第一篇匿名貼文",
    ipHash: "dev-test-hash",
    userAgent: "test-script",
  });

  console.log("Fetching posts...");
  const posts = await listPosts(5);
  console.log(posts);
}

main()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });