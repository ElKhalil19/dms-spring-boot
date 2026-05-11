package com.example.service_g.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;

import java.util.List;
import org.junit.jupiter.api.Test;

class UserStoreTest {

    @Test
    void createUserNormalizesDepartmentIds() {
        UserStore store = new UserStore();

        UserSummary created = store.createUser(new CreateUserRequest(
                "User 1",
                "u1@ensia.dz",
                "password123",
                "user",
                2L,
                List.of(2L, 2L, 1L),
                "active"
        ));

        assertEquals(2L, created.departmentId());
        assertIterableEquals(List.of(2L, 1L), created.departmentIds());
    }

    @Test
    void updateUserCanAssignMultipleDepartments() {
        UserStore store = new UserStore();
        UserSummary created = store.createUser(new CreateUserRequest(
                "User 2",
                "u2@ensia.dz",
                "password123",
                "user",
                1L,
                List.of(1L),
                "active"
        ));

        UserSummary updated = store.updateUser(created.id(), new UpdateUserRequest(
                null,
                null,
                null,
                null,
                null,
                List.of(1L, 2L),
                null
        )).orElseThrow();

        assertEquals(1L, updated.departmentId());
        assertIterableEquals(List.of(1L, 2L), updated.departmentIds());
    }
}
