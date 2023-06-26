"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestNotificationPermissions = void 0;
const requestNotificationPermissions = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notifications');
    }
    else {
        const permission = await Notification.requestPermission();
        return permission;
    }
    return Notification.permission;
};
exports.requestNotificationPermissions = requestNotificationPermissions;
//# sourceMappingURL=desktopNotificationsUtils.js.map