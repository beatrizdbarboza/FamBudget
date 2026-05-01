const token =
  sessionStorage.getItem("accessToken") ||
  localStorage.getItem("accessToken");

console.log("AUTH GUARD TOKEN:", token);

if (
  !token ||
  token === "undefined" ||
  token === "null" ||
  token === "[object Object]" ||
  !token.startsWith("eyJ")
) {
  sessionStorage.removeItem("accessToken");
  localStorage.removeItem("accessToken");

  if (!window.location.pathname.includes("index.html")) {
    window.location.href = "index.html";
  }
}