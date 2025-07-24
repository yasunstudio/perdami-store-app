-- Chat System Enums
CREATE TYPE "ChatStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CLOSED');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');
CREATE TYPE "ChatPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- Chat Sessions Table
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "subject" TEXT,
    "status" "ChatStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "ChatPriority" NOT NULL DEFAULT 'NORMAL',
    "orderId" TEXT,
    "isAssigned" BOOLEAN NOT NULL DEFAULT false,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- Chat Messages Table
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "chat_sessions_customerId_idx" ON "chat_sessions"("customerId");
CREATE INDEX "chat_sessions_assignedTo_idx" ON "chat_sessions"("assignedTo");
CREATE INDEX "chat_sessions_status_idx" ON "chat_sessions"("status");
CREATE INDEX "chat_sessions_priority_idx" ON "chat_sessions"("priority");
CREATE INDEX "chat_sessions_orderId_idx" ON "chat_sessions"("orderId");
CREATE INDEX "chat_sessions_lastActivity_idx" ON "chat_sessions"("lastActivity");
CREATE INDEX "chat_sessions_createdAt_idx" ON "chat_sessions"("createdAt");

CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");
CREATE INDEX "chat_messages_messageType_idx" ON "chat_messages"("messageType");
CREATE INDEX "chat_messages_isRead_idx" ON "chat_messages"("isRead");
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- Foreign Key Constraints
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
