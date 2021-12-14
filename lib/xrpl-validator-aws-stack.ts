import * as ec2 from '@aws-cdk/aws-ec2'
import * as cdk from '@aws-cdk/core'
import { Asset } from '@aws-cdk/aws-s3-assets'
import * as iam from '@aws-cdk/aws-iam'
import * as path from 'path'

export class XrplValidatorAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // This script is not meant to be run in a build pipeline.
    // It's meant to be run in by a trusted SA/SE.
    const accessIp = process.env.CDK_SSH_ACCESS_IP
    if (!accessIp) throw new Error('Please set CDK_SSH_ACCESS_IP')
    const accessCidr = `${accessIp}/32`

    const keyPairName = process.env.CDK_KEYPAIR_NAME
    if (!keyPairName) throw new Error('Please set CDK_KEYPAIR_NAME')

    const projectName = process.env.CDK_PROJECT_NAME
    if (!projectName) throw new Error('Please set CDK_XRPL_PROJECT_NAME')

    const region = process.env.CDK_REGION
    if (!region) throw new Error('Please set CDK_REGION')

    // Create a new VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${projectName}-subnet`,
          subnetType: ec2.SubnetType.PUBLIC
        }
      ]
    })

    // Allow SSH (TCP Port 22) access from the public IP specified in SSH_ACCESS_IP.
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow SSH (TCP port 22) in',
      allowAllOutbound: true
    })

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(accessCidr),
      ec2.Port.tcp(22),
      'Allow SSH Access'
    )

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(accessCidr),
      ec2.Port.tcp(51235),
      'XRPL Service Peering Protocol Port'
    )

    const role = new iam.Role(this, 'ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    })

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    )

    // Use an Ubuntu 20.03 Image - CPU Type X86_64
    const ami = new ec2.GenericLinuxImage({
      'us-east-1': 'ami-022d4249382309a48'
    })

    // Block device for storage.
    const rootVolume: ec2.BlockDevice = {
      // Use the root device name from
      // aws ec2 describe-images --region us-east-1 --image-ids ami-022d4249382309a48
      deviceName: '/dev/sda1',
      // Override the default volume size of 8GB and GP2 type.
      volume: ec2.BlockDeviceVolume.ebs(500, {
        volumeType: ec2.EbsDeviceVolumeType.GP3,
        iops: 10000
      })
    }

    // Create the instance using the VPC, Security Group, AMI, and add the keyPair.
    const ec2Instance = new ec2.Instance(this, 'Validator01', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.C5A,
        ec2.InstanceSize.XLARGE2
      ),
      machineImage: ami,
      securityGroup: securityGroup,
      keyName: keyPairName,
      role: role,
      blockDevices: [rootVolume]
    })

    // Create an elastic IP address and bind it to the host.
    const eip = new ec2.CfnEIP(this, 'ElasticIp', {
      domain: 'vpc',
      instanceId: ec2Instance.instanceId
    })

    // Create an asset that will be used as part of User Data to run on first load
    const asset = new Asset(this, 'Asset', {
      path: path.join(__dirname, '../bin/user-data/bootstrap.sh')
    })
    const localPath = ec2Instance.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey
    })

    ec2Instance.userData.addExecuteFileCommand({
      filePath: localPath
    })
    asset.grantRead(ec2Instance.role)

    // Create outputs for connecting
    new cdk.CfnOutput(this, 'Dynamic IP Address', {
      value: ec2Instance.instancePublicIp
    })
    new cdk.CfnOutput(this, 'Key Name', { value: keyPairName })
    new cdk.CfnOutput(this, 'SSH command', {
      value:
        `ssh -i ${keyPairName}.pem -o IdentitiesOnly=yes ubuntu@` +
        ec2Instance.instancePublicIp
    })
  }
}
