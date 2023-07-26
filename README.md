# baddybuddy

App that helps manage badminton signups. It will:
* Collect signup information from players in your group.
* Use OCR to parse a picture of the signup screen to determine who is signed up for what court.
* Shows you when it is your turn on the court.

Check it out at https://baddybuddy.vercel.app.

# How it works
* [Google Vision AI API](https://cloud.google.com/vision/docs/drag-and-drop) is used to get image annotations for the signup picture.
* With the assumption that the image contains repeating cells representing a court, we find the boundaries of each court by looking for the largest occurrences of the word `Court`.
* For each court, we then sort the annotations within its bounds from top-to-bottom and then parse signup information from that.
* Each picture of the signup screen is a snapshot of the signup state, and we will advance time in the UI to project the current state.

If you upload a picture to https://baddybuddy.vercel.app, you can click on the `Debug` button at the bottom to see what text annotations it is considering.

# Development
This app is built with [T3 Stack](https://create.t3.gg/), so the docs there are pretty helpful.

Set up an `.env` file locally following `.env.example`.

Run the app using
```bash
npm run dev
```

To make changes to the DB schema, update `prisma/schema.prisma` and then run
```bash
npx prisma db push
```
