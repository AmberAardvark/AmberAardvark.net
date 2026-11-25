---
title: "Numbat"
description: "Open-Source Data Platform"
main:
  id: 5
  content: |
    Numbat is a 100% free and open-source data platform built for small and medium-sized businesses. It's privately deployable and designed for organizations where the Microsoft Data Platform isn't the right fit — whether due to budget constraints, regulatory requirements, data sovereignty mandates, or a preference for open-source infrastructure.
  imgCard: "@/images/dashboard-image.avif"
  imgMain: "@/images/amber-aardvark-map.png"
  imgAlt: "Numbat open-source data platform architecture"
tabs:
  - id: "tabs-with-card-item-1"
    dataTab: "#tabs-with-card-1"
    title: "Description"
  - id: "tabs-with-card-item-2"
    dataTab: "#tabs-with-card-2"
    title: "Features"
  - id: "tabs-with-card-item-3"
    dataTab: "#tabs-with-card-3"
    title: "Architecture"
longDescription:
  title: "A Sovereign, FOSS-First Data Platform"
  subTitle: |
    Named for the small marsupial whose independently-evolved traits combine into a highly specialized whole, Numbat brings together 17 focused, best-in-class open-source components — spanning storage, analytics, orchestration, visualization, and governance — into one cohesive platform built for budget-conscious, niche-focused businesses.
  btnTitle: "Contact sales to learn more"
  btnURL: "#"
descriptionList:
  - title: "FOSS First"
    subTitle: "Every component is free and open-source, with no per-seat licensing or proprietary dependencies."
  - title: "Sovereign By Default"
    subTitle: "Runs entirely on your private infrastructure, with predictable, fixed hardware costs instead of variable per-user or per-GB cloud pricing."
  - title: "Incremental Adoption"
    subTitle: "Start with a handful of core components and add the rest as your needs grow, with dependency DAGs inferred automatically from code."
specificationsLeft:
  - title: "Core Stack"
    subTitle: "PostgreSQL, MinIO, Apache Iceberg, DuckDB, Polars, and Dagster form the storage, transformation, and orchestration backbone."
  - title: "Analytics & Apps"
    subTitle: "Cube, Apache Superset, Vega-Lite/D3.js, and Appsmith power semantic modeling, dashboards, and custom data apps."
  - title: "Governance & Security"
    subTitle: "DataHub, Authentik, and OpenBao handle data governance, identity, and secrets management."
  - title: "Status"
    subTitle: "Currently in active design and architecture, with a phased rollout planned from a focused five-component core."
tableData:
  - feature: ["Component", "Role", "Comparable Microsoft Service"]
    description:
      - ["PostgreSQL", "OLTP Storage", "SQL Server / Azure SQL"]
      - ["MinIO", "Object Storage", "ADLS Gen2 / OneLake"]
      - ["DuckDB", "Analytical Engine", "SSAS / Synapse"]
      - ["Dagster", "Orchestration + DAG", "SSIS / ADF / Fabric Data Factory"]
      - ["Apache Superset", "Dashboards", "Power BI"]
blueprints:
  first: "@/images/amber-aardvark-features.png"
  second: "@/images/amber-aardvark-map.png"
---
