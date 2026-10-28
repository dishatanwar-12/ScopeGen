import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_client_crud_and_isolation(client: AsyncClient, auth_headers_a, auth_headers_b):
    # 1. User A creates a client
    create_payload = {
        "company_name": "Starlight Analytics",
        "primary_contact_name": "David Miller",
        "contact_email": "david@starlight.example.com",
        "industry": "Data & AI",
        "website": "https://starlight.example.com"
    }
    res_create = await client.post("/api/v1/clients", json=create_payload, headers=auth_headers_a)
    assert res_create.status_code == 201
    client_a_id = res_create.json()["id"]

    # 2. User A can retrieve it
    res_get_a = await client.get(f"/api/v1/clients/{client_a_id}", headers=auth_headers_a)
    assert res_get_a.status_code == 200
    assert res_get_a.json()["company_name"] == "Starlight Analytics"

    # 3. User B CANNOT retrieve User A's client (Tenant Isolation)
    res_get_b = await client.get(f"/api/v1/clients/{client_a_id}", headers=auth_headers_b)
    assert res_get_b.status_code == 404

    # 4. User B CANNOT delete User A's client
    res_del_b = await client.delete(f"/api/v1/clients/{client_a_id}", headers=auth_headers_b)
    assert res_del_b.status_code == 404

    # 5. User A updates the client
    update_payload = {"company_name": "Starlight Global Analytics"}
    res_update_a = await client.put(f"/api/v1/clients/{client_a_id}", json=update_payload, headers=auth_headers_a)
    assert res_update_a.status_code == 200
    assert res_update_a.json()["company_name"] == "Starlight Global Analytics"

@pytest.mark.asyncio
async def test_project_crud_and_isolation(client: AsyncClient, auth_headers_a, auth_headers_b):
    # Create client under User A
    c_res = await client.post("/api/v1/clients", json={
        "company_name": "Nexus Corp",
        "primary_contact_name": "Elena Rostova",
        "contact_email": "elena@nexus.example.com",
        "industry": "Fintech"
    }, headers=auth_headers_a)
    client_id = c_res.json()["id"]

    # User A creates a project
    proj_payload = {
        "client_id": client_id,
        "title": "Fintech High-Frequency Risk Engine SOW",
        "project_type": "Cloud Infrastructure",
        "business_problem": "Latency issues during trade execution exceed SLA limits.",
        "desired_outcomes": "Sub-millisecond processing pipelines with zero dropped messages.",
        "existing_environment": "Bare-metal clusters with Kafka"
    }
    res_proj = await client.post("/api/v1/projects", json=proj_payload, headers=auth_headers_a)
    assert res_proj.status_code == 201
    proj_id = res_proj.json()["id"]

    # User B cannot access User A's project
    res_proj_b = await client.get(f"/api/v1/projects/{proj_id}", headers=auth_headers_b)
    assert res_proj_b.status_code == 404

