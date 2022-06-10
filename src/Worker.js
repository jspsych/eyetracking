self.addEventListener("message", (e) => {
  const data = e.data;
  switch (data.cmd) {
    case "foo":
      self.postMessage(foo());
    case "bar":
      self.postMessage(bar());
  }
});

const foo = () => {
  return Math.random();
};

const bar = () => {
  return Math.floor(Math.random() * 100);
};
