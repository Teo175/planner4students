from typing import Iterable

from sqlalchemy import func, and_

from server.models.domain import Domain
from server.models.professor import Professor
from server.models.student import Student


class DomainRepository:

    def __init__(self, sess):
        self.session = sess

    def find_by_name(self, name: str) -> Domain | None:
        return self.session.query(Domain).filter_by(
          name = name
        ).first()

    def add_domain(self, name: str) -> Domain:
        domain = Domain(
           name=name
        )
        self.session.add(domain)
        self.session.commit()
        return domain

  