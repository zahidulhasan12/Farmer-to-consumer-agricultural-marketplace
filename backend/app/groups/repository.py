# Repository for Farmer Cooperative Groups and Memberships.
import uuid
from sqlmodel import Session, col, func, select

from app.groups.models import Group, GroupMember


class GroupRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_group(self, group: Group) -> Group:
        self.session.add(group)
        self.session.commit()
        self.session.refresh(group)
        return group

    def get_group(self, group_id: uuid.UUID) -> Group | None:
        return self.session.get(Group, group_id)

    def list_all_groups(self) -> list[Group]:
        statement = select(Group).order_by(col(Group.created_at).desc())
        return list(self.session.exec(statement).all())

    def list_groups_for_user(self, user_id: uuid.UUID) -> list[Group]:
        # User is either the group owner OR in group_members table
        statement = (
            select(Group)
            .join(GroupMember, Group.id == GroupMember.group_id, isouter=True)
            .where((Group.owner_id == user_id) | (GroupMember.user_id == user_id))
            .distinct()
            .order_by(col(Group.created_at).desc())
        )
        return list(self.session.exec(statement).all())

    def delete_group(self, group: Group) -> None:
        # Delete associated members first
        statement = select(GroupMember).where(GroupMember.group_id == group.id)
        members = self.session.exec(statement).all()
        for m in members:
            self.session.delete(m)
        self.session.delete(group)
        self.session.commit()

    def add_member(self, member: GroupMember) -> GroupMember:
        self.session.add(member)
        self.session.commit()
        self.session.refresh(member)
        return member

    def get_member(self, group_id: uuid.UUID, user_id: uuid.UUID) -> GroupMember | None:
        statement = select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        )
        return self.session.exec(statement).first()

    def list_members(self, group_id: uuid.UUID) -> list[GroupMember]:
        statement = select(GroupMember).where(GroupMember.group_id == group_id).order_by(col(GroupMember.joined_at).asc())
        return list(self.session.exec(statement).all())

    def count_members(self, group_id: uuid.UUID) -> int:
        statement = select(func.count()).select_from(GroupMember).where(GroupMember.group_id == group_id)
        return self.session.exec(statement).one()

    def remove_member(self, member: GroupMember) -> None:
        self.session.delete(member)
        self.session.commit()
