# API Router for Farmer Cooperative Groups and Memberships.
import uuid
from fastapi import APIRouter, HTTPException, status

from app.auth.dependencies import CurrentUserDep
from app.groups.dependencies import GroupServiceDep
from app.groups.schemas import (
    GroupCreate,
    GroupMemberAdd,
    GroupMemberRead,
    GroupRead,
)
from app.groups.service import GroupRuleError

router = APIRouter(tags=["groups"])


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(
    data: GroupCreate,
    current_user: CurrentUserDep,
    service: GroupServiceDep,
) -> GroupRead:
    """Create a new farmer cooperative group."""
    try:
        return service.create_group(current_user, data)
    except GroupRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("", response_model=list[GroupRead])
def list_groups(
    current_user: CurrentUserDep,
    service: GroupServiceDep,
) -> list[GroupRead]:
    """List cooperative groups the user belongs to (or all groups if Admin)."""
    return service.list_groups(current_user)


@router.get("/{group_id}", response_model=GroupRead)
def get_group(
    group_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: GroupServiceDep,
) -> GroupRead:
    """Get full details of a cooperative group including member roster."""
    try:
        return service.get_group_details(group_id, current_user)
    except GroupRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{group_id}/members", response_model=GroupMemberRead, status_code=status.HTTP_201_CREATED)
def add_member(
    group_id: uuid.UUID,
    data: GroupMemberAdd,
    current_user: CurrentUserDep,
    service: GroupServiceDep,
) -> GroupMemberRead:
    """Invite or add a registered user to the cooperative group."""
    try:
        return service.add_member(group_id, current_user, data)
    except GroupRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    group_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: GroupServiceDep,
) -> None:
    """Remove a member from the cooperative (or leave the group)."""
    try:
        service.remove_member(group_id, current_user, user_id)
    except GroupRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: GroupServiceDep,
) -> None:
    """Delete a cooperative group (Owner or System Admin only)."""
    try:
        service.delete_group(group_id, current_user)
    except GroupRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
