self.addEventListener("push", function (event) {
  const data = event.data?.json() ?? {};

  const title = data.title || "Neelamrit";
  const options = {
    body: data.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "neelamrit-notification",
    data: { url: data.url || "/" },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync — app band ho tab bhi kaam kare
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());