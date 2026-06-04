async function testResolve() {
  const ids = [3455, 12485, 3416];
  const response = await fetch("https://esi.evetech.net/latest/universe/names/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids)
  });
  if (!response.ok) {
    console.error("Error:", response.status, await response.text());
    return;
  }
  const data = await response.json();
  console.log(data);
}
testResolve();
