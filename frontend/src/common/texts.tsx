export const MESSAGE: string =
  "Something went wrong with the database, try refreshing the page!";
export const LOGIN_ERROR_MESSAGE_FIELDS_MISSING: string =
  "You must provide both the email and the password!";
export const LOGIN_ERROR_MESSAGE_CREDENTIALS_MISMATCH: string =
  "The provided credentials do not match. Try again!";
export const CONTEXT_ERROR: string =
  "useUserContext must be used within a UserProvider";
export const FETCH_EMAILS_ERROR = "Failed to fetch emails.";
export const EMAIL_CONTEXT_ERROR =
  "useEmailContext must be used within an EmailProvider";
export const FETCH_USERS_ERROR = "Failed to fetch users:";
export const ASSIGN_NOTIFICATION_MESSAGE = (sender_email: string) =>
  `You were assigned to solve ${sender_email} complain!`;
export const REPLY_NOTIFICATION_MESSAGE = (reply_sender: string) => `Your email got a new reply from ${reply_sender}!`;
export const STATUS_CHANGE_NOTIFICATION_MESSAGE = (status: string) => `The status of your complaint changed to ${status}!`;
export const ACTIVITY_NOTIFICATION_MESSAGE = "The email you were assigned to solve got new activity!";
export const USER = "user";
export const INBOX_ID = "inbox";
export const SPAM_ID = "spam";
export const CONFIRMATION_DIALOG =
  "Are you sure you want to delete the selected emails? This action cannot be undone.";
export const TRANSLATE = "Translate";
export const SUMMARIZE = "Summarize";
export const SHOW_ORIGINAL = "Show original";
export const TRANSLATION_LOADING = "Translation is loading...";
