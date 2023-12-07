import { Ai } from "@cloudflare/ai";
import { Hono } from "hono";

import template from "./template.html";
import streamingTemplate from "./template-streaming.html";

const app = new Hono();

app.get("/", (c) => c.html(streamingTemplate));
app.get("/b", (c) => c.html(template));

app.get("/stream", async (c) => {
  const ai = new Ai(c.env.AI);

  const query = c.req.query("query");
  const question = query || "What is the square root of 9?";

  const systemPrompt = `You are a helpful assistant.`;
  const stream = await ai.run(
    "@cf/meta/llama-2-7b-chat-int8",
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      stream: true,
    },
  );

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
    },
  });
});

app.post("/", async (c) => {
  const ai = new Ai(c.env.AI);

  const body = await c.req.json();
  const question = body.query || "What is the square root of 9?";

  const systemPrompt = `You are a helpful assistant.`;

  const { response: answer } = await ai.run(
    "@cf/meta/llama-2-7b-chat-int8",
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    },
  );

  return c.text(answer);
});

app.onError((err, c) => {
  return c.text(err);
});

export default app;
