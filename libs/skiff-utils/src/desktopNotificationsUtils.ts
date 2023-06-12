export const requestNotificationPermissions = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
  } else {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return Notification.permission;
};
