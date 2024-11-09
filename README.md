# nci-webtools-ctri-idp

## API Usage Examples

### model/run

```js
const endpoint = "http://localhost:8080/api/model/run";
const model = "anthropic.claude-3-5-sonnet-20240620-v1:0";
const message = "Please return 42";
const response = await fetch(endpoint, {
  method: "post",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ model, message }),
});
const results = await response.json();
console.log(results, results.output.message);
```

### model/converse

```js
const endpoint = "http://localhost:8080/api/model/converse";
const model = "anthropic.claude-3-5-sonnet-20240620-v1:0";
const messages = [
  {
    role: "user",
    content: [{ text: "Please provide the answer to everything." }],
  },
];
const response = await fetch(endpoint, {
  method: "post",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ model, messages }),
});
const results = await response.json();
console.log(results, results.output.message);
```
