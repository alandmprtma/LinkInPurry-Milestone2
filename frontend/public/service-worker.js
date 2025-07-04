self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    let title = "Notification";
    let options = {
      body: data.message,
      icon: "/default-icon.png", // Ganti dengan path ikon default
      badge: "/default-badge.png", // Ganti dengan path badge jika diperlukan
      data: { url: "/" }, // Default URL
    };

    console.log("Push event received", data.type);
    // Tentukan notifikasi berdasarkan tipe
    if (data.type === "chat") {
      title = "New Message";
      options.icon = "/chat-icon.png"; // Ikon untuk pesan
      options.data.url = `/chat?id=${data.contactId}`; // URL chat dengan parameter contactId
    } else if (data.type === "post") {
      title = "New Post";
      options.icon = "/post-icon.png"; // Ikon untuk postingan
      options.data.url = `/feed`; // URL feed dengan parameter postId
    }

    // Tampilkan notifikasi
    self.registration.showNotification(title, options);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Jika ada tab yang sudah terbuka, fokuskan
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Jika tidak, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
