# Business logic for Farmer Cooperatives and Group permissions.
import uuid
from app.auth.models import User
from app.auth.repository import AuthRepository
from app.groups.models import Group, GroupMember
from app.groups.repository import GroupRepository
from app.groups.schemas import (
    GroupCreate,
    GroupMemberAdd,
    GroupMemberRead,
    GroupRead,
)


class GroupRuleError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class GroupService:
    def __init__(self, group_repo: GroupRepository, auth_repo: AuthRepository) -> None:
        self.repo = group_repo
        self.auth_repo = auth_repo

    def create_group(self, owner: User, data: GroupCreate) -> GroupRead:
        if owner.role == "CONSUMER":
            raise GroupRuleError("Only registered farmers and administrators can establish cooperatives.", status_code=403)

        group = Group(
            name=data.name.strip(),
            description=data.description.strip() if data.description else None,
            owner_id=owner.id,
        )
        created_group = self.repo.create_group(group)

        # Automatically add the creator as Group ADMIN
        creator_membership = GroupMember(
            group_id=created_group.id,
            user_id=owner.id,
            permission="ADMIN",
        )
        self.repo.add_member(creator_membership)

        return GroupRead(
            id=created_group.id,
            name=created_group.name,
            description=created_group.description,
            owner_id=created_group.owner_id,
            owner_name=owner.name,
            my_permission="ADMIN",
            created_at=created_group.created_at,
            members_count=1,
            members=[
                GroupMemberRead(
                    id=creator_membership.id,
                    user_id=owner.id,
                    email=owner.email,
                    name=owner.name,
                    role=owner.role,
                    permission="ADMIN",
                    joined_at=creator_membership.joined_at,
                )
            ],
        )

    def list_groups(self, current_user: User) -> list[GroupRead]:
        if current_user.role == "ADMIN":
            raw_groups = self.repo.list_all_groups()
        else:
            raw_groups = self.repo.list_groups_for_user(current_user.id)

        result: list[GroupRead] = []
        for g in raw_groups:
            owner = self.auth_repo.get_user_by_id(g.owner_id)
            membership = self.repo.get_member(g.id, current_user.id)
            my_perm = "ADMIN" if g.owner_id == current_user.id else (membership.permission if membership else None)
            count = self.repo.count_members(g.id)
            result.append(
                GroupRead(
                    id=g.id,
                    name=g.name,
                    description=g.description,
                    owner_id=g.owner_id,
                    owner_name=owner.name if owner else "Unknown Farmer",
                    my_permission=my_perm,
                    created_at=g.created_at,
                    members_count=count,
                )
            )
        return result

    def get_group_details(self, group_id: uuid.UUID, current_user: User) -> GroupRead:
        group = self.repo.get_group(group_id)
        if not group:
            raise GroupRuleError("Cooperative group not found.", status_code=404)

        owner = self.auth_repo.get_user_by_id(group.owner_id)
        my_membership = self.repo.get_member(group.id, current_user.id)
        my_perm = "ADMIN" if group.owner_id == current_user.id else (my_membership.permission if my_membership else None)

        raw_members = self.repo.list_members(group.id)
        member_reads: list[GroupMemberRead] = []
        for m in raw_members:
            u = self.auth_repo.get_user_by_id(m.user_id)
            if u:
                member_reads.append(
                    GroupMemberRead(
                        id=m.id,
                        user_id=u.id,
                        email=u.email,
                        name=u.name,
                        role=u.role,
                        permission=m.permission,
                        joined_at=m.joined_at,
                    )
                )

        return GroupRead(
            id=group.id,
            name=group.name,
            description=group.description,
            owner_id=group.owner_id,
            owner_name=owner.name if owner else "Farmer",
            my_permission=my_perm,
            created_at=group.created_at,
            members_count=len(member_reads),
            members=member_reads,
        )

    def add_member(self, group_id: uuid.UUID, current_user: User, data: GroupMemberAdd) -> GroupMemberRead:
        group = self.repo.get_group(group_id)
        if not group:
            raise GroupRuleError("Cooperative group not found.", status_code=404)

        # Only group owner or group ADMIN or system ADMIN can add members
        my_membership = self.repo.get_member(group.id, current_user.id)
        can_admin = (
            current_user.role == "ADMIN"
            or group.owner_id == current_user.id
            or (my_membership and my_membership.permission == "ADMIN")
        )
        if not can_admin:
            raise GroupRuleError("You do not have permission to invite members to this cooperative.", status_code=403)

        target_user = self.auth_repo.get_user_by_email(data.email)
        if not target_user:
            raise GroupRuleError(f"No registered account found with email '{data.email}'.", status_code=404)

        existing = self.repo.get_member(group.id, target_user.id)
        if existing:
            raise GroupRuleError(f"User '{target_user.name}' is already a member of this cooperative.", status_code=409)

        new_membership = GroupMember(
            group_id=group.id,
            user_id=target_user.id,
            permission=data.permission,
        )
        saved = self.repo.add_member(new_membership)

        return GroupMemberRead(
            id=saved.id,
            user_id=target_user.id,
            email=target_user.email,
            name=target_user.name,
            role=target_user.role,
            permission=saved.permission,
            joined_at=saved.joined_at,
        )

    def remove_member(self, group_id: uuid.UUID, current_user: User, target_user_id: uuid.UUID) -> None:
        group = self.repo.get_group(group_id)
        if not group:
            raise GroupRuleError("Cooperative group not found.", status_code=404)

        if group.owner_id == target_user_id:
            raise GroupRuleError("The cooperative creator/owner cannot be removed.", status_code=400)

        my_membership = self.repo.get_member(group.id, current_user.id)
        can_admin = (
            current_user.role == "ADMIN"
            or group.owner_id == current_user.id
            or (my_membership and my_membership.permission == "ADMIN")
            or current_user.id == target_user_id  # A user can leave the group
        )
        if not can_admin:
            raise GroupRuleError("Permission denied to remove member.", status_code=403)

        target_membership = self.repo.get_member(group.id, target_user_id)
        if not target_membership:
            raise GroupRuleError("User is not a member of this cooperative.", status_code=404)

        self.repo.remove_member(target_membership)

    def delete_group(self, group_id: uuid.UUID, current_user: User) -> None:
        group = self.repo.get_group(group_id)
        if not group:
            raise GroupRuleError("Cooperative group not found.", status_code=404)

        can_delete = current_user.role == "ADMIN" or group.owner_id == current_user.id
        if not can_delete:
            raise GroupRuleError("Only the cooperative creator or an administrator can delete this group.", status_code=403)

        self.repo.delete_group(group)
