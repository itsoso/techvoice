from enum import StrEnum


class FeedbackType(StrEnum):
    VENT = "vent"
    PROPOSAL = "proposal"


class FeedbackStatus(StrEnum):
    RECEIVED = "received"
    REVIEWING = "reviewing"
    NEEDS_INFO = "needs_info"
    ACCEPTED = "accepted"
    DEFERRED = "deferred"
    PUBLISHED = "published"
    HIDDEN = "hidden"


class ActorType(StrEnum):
    SYSTEM = "system"
    ADMIN = "admin"
    EMPLOYEE = "employee"


class EventType(StrEnum):
    SUBMITTED = "submitted"
    STATUS_CHANGED = "status_changed"
    REPLY = "reply"
    PUBLISHED = "published"
    HIDDEN = "hidden"
    RESTORED = "restored"
    STARRED = "starred"
