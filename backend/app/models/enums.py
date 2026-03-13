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


class TenantStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ExecutiveApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class LoungeEventStatus(StrEnum):
    DRAFT = "draft"
    TICKETING = "ticketing"
    LIVE = "live"
    CLOSED = "closed"
    ARCHIVED = "archived"


class LoungeTicketStatus(StrEnum):
    CLAIMED = "claimed"
    ENTERED = "entered"
    EXPIRED = "expired"


class LoungeSessionStatus(StrEnum):
    WAITING = "waiting"
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"


class LoungeSenderType(StrEnum):
    PARTICIPANT = "participant"
    EXECUTIVE = "executive"
    SYSTEM = "system"
