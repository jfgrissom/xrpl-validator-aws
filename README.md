# XRPL Validator AWS

This project is meant to get the latest version of an XRPL Validator up and running quickly in AWS.

## Expectations

Please read and take the time to understand the [documentation for the XRPL](https://xrpl.org/). The section related to [managing the XRPL Service](https://xrpl.org/manage-the-rippled-server.html) is of particular interest if you wish to operate this service.

There is a level of engagement that is required to successfully run a validator on the XRPL. Updates, voting, and other activities are required to operate this service correctly. It's not a "set and forget" endeavor.

The default EC2 type that is deployed using this code is C5A.2XLARGE. You'll need to check on pricing for the region you run this code in.

Understand that running this code in your AWS account will produce resources that cost about $200 USD per month (not including any changes you make or discounts you receive from AWS).

It's worth nothing there is no compensation for running an XRPL Validator. Aside from genuinely providing a public good to the world there is no direct financial compensation. Indirectly running this service can be monetized if you provide additional services that on top of this XRPL service.

## Deployed

This script will deploy a server with the following specs:

- 8 Cores
- 8 Thread
- 16GB RAM
- 500GB high speed EBS Block storage (10000 IOP GP3)

Additionally all the extra items needed to run this host in AWS are added too. These include things include a VPC for the host to operate out of and an elastic IP address.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Production

To make this a production ready deployment there are still a lot of items that need to be added. Clustering, load balancing, domain, SSL (TLS), etc... are all considerations that are not in this repository (yet).

I'll be adding these features in the future for now think of this as the first iteration of many on a road to the ideal environment for an XRPL Validator service.

## Forking

This code is a personal project of mine and I use it for my own XRPL validator. Please fork this code base to make adjustments for your own use case.
