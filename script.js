// --- Fake Admin Credentials ---
const ADMIN_USER = "admin";
const ADMIN_PASS = "Anuga123";

// --- Load Plugins from localStorage ---
function getPlugins() {
  return JSON.parse(localStorage.getItem("plugins") || "[]");
}

function savePlugins(plugins) {
  localStorage.setItem("plugins", JSON.stringify(plugins));
}

// --- Display Plugins on Home Page ---
if (document.getElementById("plugin-list")) {
  let plugins = getPlugins();
  let container = document.getElementById("plugin-list");
  plugins.forEach((plugin, index) => {
    let div = document.createElement("div");
    div.className = "plugin-card";
    div.innerHTML = `
      <h3>${plugin.title}</h3>
      <button onclick="downloadPlugin(${index})">Download</button>
    `;
    container.appendChild(div);
  });

  // Track views
  let views = localStorage.getItem("views") || 0;
  views++;
  localStorage.setItem("views", views);
}

// --- Login System ---
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let u = document.getElementById("username").value;
    let p = document.getElementById("password").value;

    if (u === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem("isAdmin", "true");
      window.location.href = "admin-dashboard.html";
    } else {
      document.getElementById("error").innerText = "Invalid username or password!";
    }
  });
}

// --- Admin Dashboard ---
if (document.getElementById("pluginForm")) {
  if (sessionStorage.getItem("isAdmin") !== "true") {
    alert("Access Denied!");
    window.location.href = "login.html";
  }

  let viewCount = localStorage.getItem("views") || 0;
  document.getElementById("viewCount").innerText = viewCount;

  let plugins = getPlugins();
  document.getElementById("pluginCount").innerText = plugins.length;

  // Add Plugin
  document.getElementById("pluginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let title = document.getElementById("pluginTitle").value;
    let code = document.getElementById("pluginCode").value;

    plugins.push({ title, code });
    savePlugins(plugins);
    alert("Plugin Added!");
    location.reload();
  });

  // Manage Plugins
  let adminList = document.getElementById("adminPluginList");
  plugins.forEach((plugin, index) => {
    let div = document.createElement("div");
    div.className = "plugin-card";
    div.innerHTML = `
      <h3>${plugin.title}</h3>
      <button onclick="editPlugin(${index})">Edit</button>
      <button onclick="deletePlugin(${index})">Delete</button>
    `;
    adminList.appendChild(div);
  });
}

// --- Download Plugin ---
function downloadPlugin(index) {
  let plugins = getPlugins();
  let plugin = plugins[index];
  let blob = new Blob([plugin.code], { type: "text/plain" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = plugin.title.replace(/\s+/g, "_") + ".txt";
  link.click();
}

// --- Edit Plugin ---
function editPlugin(index) {
  let plugins = getPlugins();
  let newTitle = prompt("Edit Plugin Title:", plugins[index].title);
  let newCode = prompt("Edit Plugin Code:", plugins[index].code);
  if (newTitle && newCode) {
    plugins[index] = { title: newTitle, code: newCode };
    savePlugins(plugins);
    location.reload();
  }
}

// --- Delete Plugin ---
function deletePlugin(index) {
  let plugins = getPlugins();
  if (confirm("Delete this plugin?")) {
    plugins.splice(index, 1);
    savePlugins(plugins);
    location.reload();
  }
                                                         }
