/**
 * useNotifications Composable
 *
 * Handles notification permissions and sending notifications.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 */

export const useNotifications = () => {
	const toast = useToast();

	const showNotification = async (title: string, body: string) => {
		const permissionGranted = await useTauriNotificationIsPermissionGranted();

		if (!permissionGranted) {
			const permission = await useTauriNotificationRequestPermission();
			if (permission !== "granted") {
				toast.add({
					title: "Error",
					description: "Missing notifications permission",
					color: "error"
				});
				return;
			}
		}

		useTauriNotificationSendNotification({
			title,
			body
		});
	};

	return {
		showNotification
	};
};
