# Chat E2E Test Checklist

Use this checklist to validate the buyer-seller property chat flow in QA/staging.

## Prerequisites

- Backend and frontend are running.
- MongoDB is connected.
- Two users exist:
  - Buyer account
  - Seller account
- At least one property exists with valid `sellerId`.

## 1) Conversation Creation/Re-use

- Login as buyer.
- Open property details.
- Click "Chat with Seller".
- Verify API call: `POST /api/chat/conversations` with `propertyId`.
- Expected:
  - Conversation is created on first click.
  - Same conversation is returned on second click.
  - DB has only one conversation for `(propertyId, buyerId, sellerId)`.

## 2) Conversation Listing

- Open chat page as buyer.
- Verify API call: `GET /api/chat/conversations`.
- Expected:
  - Conversation appears in list.
  - Last message/unread count are correct.
  - Pagination object is present.

## 3) Real-time Send/Receive

- Keep buyer and seller logged in different browsers/devices.
- Buyer sends message.
- Expected:
  - Message saved in DB.
  - Seller receives message in realtime (`receiveMessage`/`message:new`).
  - Buyer gets `message:sent` ack.
  - Conversation `lastMessage` and `lastMessageAt` updated.

## 4) Notification Creation + Realtime

- Buyer sends message while seller is online.
- Expected:
  - Notification document created (`type=message`, `referenceId=conversationId`).
  - Seller receives `newNotification` event.
  - Unread badge updates via `chat:unread-count`.

## 5) Seen State

- Seller opens conversation.
- Trigger read path (socket `message:markRead` or API fallback).
- Expected:
  - Message `seen=true`, `seenAt` set.
  - Conversation unread count for seller resets to 0.
  - `GET /api/chat/unread-summary` reflects reduced unread values.

## 6) Offline Email Policy

- Seller goes offline (disconnect all sockets).
- Buyer sends multiple messages.
- Expected:
  - First unread message triggers email.
  - Follow-up emails are throttled until inactivity threshold is reached.
  - No email is sent if SMTP is not configured (only warning logs).

## 7) Authorization & Security

- Try accessing conversation/messages with unrelated user token.
- Expected:
  - `403` for unauthorized access.
- Try invalid IDs for conversation/notification endpoints.
- Expected:
  - `400` validation errors.
- Verify all chat routes require JWT.

## 8) Notification APIs

- `GET /api/chat/notifications` returns paginated list.
- `PATCH /api/chat/notifications/:notificationId/read` marks one as read.
- `PATCH /api/chat/notifications/read-all` marks all unread as read.
- `GET /api/chat/unread-summary` returns message + notification counts.

## 9) Reconnect Behavior

- Disconnect network temporarily for buyer.
- Reconnect.
- Expected:
  - Socket reconnects.
  - Conversation room rejoin works.
  - Unread summary resync is triggered.

## 10) Regression Checks

- `npm run build` passes for frontend.
- Backend modules load without runtime import errors.
- Existing auth/property flows remain functional.
