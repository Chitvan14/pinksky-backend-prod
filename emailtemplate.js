module.exports = function (type, data) {
  let html = "";
  if (type === "test") {
    html = `<strong> this is just test from ${data.name}</strong>`;
  }
  return html;
};
