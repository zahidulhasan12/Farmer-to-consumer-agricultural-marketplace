# Dependency injection for Cooperative Group service.
from typing import Annotated
from fastapi import Depends

from app.auth.repository import AuthRepository
from app.database import SessionDep
from app.groups.repository import GroupRepository
from app.groups.service import GroupService


def get_group_service(session: SessionDep) -> GroupService:
    return GroupService(GroupRepository(session), AuthRepository(session))


GroupServiceDep = Annotated[GroupService, Depends(get_group_service)]
