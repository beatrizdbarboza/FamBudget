(function () {
  const token = sessionStorage.getItem("accessToken");

  console.log("AUTH GUARD TOKEN:", token);

  if (!token || token === "null" || token === "undefined") {
    console.log("SEM TOKEN → REDIRECIONANDO");
    window.location.href = "index.html";
    return;
  }
})();