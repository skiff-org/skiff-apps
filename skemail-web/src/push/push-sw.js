/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
console.log('Skiff Service Worker Loaded...');

self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Got Email Notification!', data?.emailSender);
  // show notification with icon and url
  self.registration.showNotification(data.plainTextSubject, {
    body: data.emailSender,
    icon: './favicon/skemail-logo-256x256.png',
    data: {
      url: data.url
    }
  });
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
