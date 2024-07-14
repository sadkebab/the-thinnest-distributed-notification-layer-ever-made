# About this

This is supposed to be a distributable pub/sub notification system that allows stateless backends to communicate with frontends in realtime.
It is meant to be used in distributed systems but it can also be used in single-node setups.
It is meant to have the smallest API surface area possible, but powerful enough to be built application specific abstractions on top of it.
It is meant to be plug and play for local development, ideally you should just include a docker image in a docker-compose file and run it without any additional configuration except exposing the port and setting an APP_KEY variable for authenticing the push requests.

# How it works

The two components of the system are "relay" nodes and the "nexus".

The relay nodes are meant to be connected to a single nexus but they can also run standalone if the nexus url is not provided or unreachable.
The nexus job is to inform the relay nodes about each other.

Backends should push to the closest relay node, and the frontends should subscribe to their closes relay node too.
Once the relay node receives the push request, it will propagate it to clients connected on them and then will bounce the same push request to other known relay nodes.

Relay nodes are fault tolerant, they will try to connect to the nexus and if the connection is interrupted, they will retry after a timeout.
The effect on a distributed scale is that clients will receive events if they are pushed to the same relay node, guaranteeing that it will always work properly in the region of the node, making it a problem only for frontends connected to nodes in other regions.

# Imrovements

- nexus redundancy

# Requiremets

- Docker
- NodeJS 22.x
- pnpm

# TODO

- pnpm workspaces
- turbo repo or nix
- system tests with docker-compose
- eslint
- multi-channel subscribe and push
