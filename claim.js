require('dotenv').config();
const { ethers } = require('ethers');

// 配置
const CONFIG = {
    // Base主网RPC
    RPC_URL: 'https://mainnet.base.org',
    // 合约地址
    CONTRACT_ADDRESS: '0x6A3044c1Cf077F386c9345eF84f2518A2682Dfff',
    // 私钥 - 请在环境变量中设置
    PRIVATE_KEY: process.env.PRIVATE_KEY || '',
    // Gas配置
    GAS_LIMIT: '300000',
    MAX_FEE_PER_GAS: ethers.parseUnits('0.1', 'gwei'), // 1 gwei
    MAX_PRIORITY_FEE_PER_GAS: ethers.parseUnits('0.001', 'gwei') // 0.1 gwei
};

// 合约ABI
const CONTRACT_ABI = [{
    "inputs": [{
        "internalType": "bytes32[]",
        "name": "_proof",
        "type": "bytes32[]"
    }, {
        "internalType": "address",
        "name": "_to",
        "type": "address"
    }, {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
    }, {
        "internalType": "uint8",
        "name": "_season",
        "type": "uint8"
    }, {
        "internalType": "uint256",
        "name": "_duration",
        "type": "uint256"
    }, {
        "internalType": "bytes",
        "name": "_signature",
        "type": "bytes"
    }],
    "name": "claim",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
}];

// 领取数据 修改为自己的claims的数据，可以从网站上获取
const CLAIM_DATA = {};

async function claimTokens() {
    try {
        console.log('🚀 开始执行领取操作...');

        // 检查私钥
        if (!CONFIG.PRIVATE_KEY) {
            throw new Error('请在环境变量中设置 PRIVATE_KEY');
        }

        // 创建provider和wallet
        const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
        const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);

        console.log('📮 钱包地址:', wallet.address);

        // 检查余额
        const balance = await provider.getBalance(wallet.address);
        console.log('💰 ETH余额:', ethers.formatEther(balance));

        // 创建合约实例
        const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        // 准备函数参数
        const claimParams = {
            _proof: CLAIM_DATA.proof,
            _to: wallet.address,
            _amount: CLAIM_DATA.amount,
            _season: 0, // 根据实际情况调整
            _duration: 0, // 根据实际情况调整
            _signature: '0x' // 提供的_signature为0x
        };

        console.log('📋 领取参数:');
        console.log('  - 接收地址:', claimParams._to);
        console.log('  - 领取数量:', ethers.formatEther(claimParams._amount), 'tokens');
        console.log('  - 证明数量:', claimParams._proof.length);
        console.log('  - Season:', claimParams._season);
        console.log('  - Duration:', claimParams._duration);

        // // 估算gas费用
        // console.log('⛽ 估算Gas费用...');
        // const gasEstimate = await contract.claim.estimateGas(
        //     claimParams._proof,
        //     claimParams._to,
        //     claimParams._amount,
        //     claimParams._season,
        //     claimParams._duration,
        //     claimParams._signature,
        //     { value: 0 } // 如果需要支付ETH，请调整这个值
        // );

        // console.log('📊 预估Gas使用量:', gasEstimate.toString());

        // 构建交易选项
        const txOptions = {
            gasLimit: CONFIG.GAS_LIMIT,
            maxFeePerGas: CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            value: 125000000000000n // 如果需要支付ETH，请调整这个值
        };

        // 发送交易
        console.log('📤 发送领取交易...');
        const tx = await contract.claim(
            claimParams._proof,
            claimParams._to,
            claimParams._amount,
            claimParams._season,
            claimParams._duration,
            claimParams._signature,
            txOptions
        );

        console.log('🔗 交易哈希:', tx.hash);
        console.log('⏳ 等待交易确认...');

        // 等待交易确认
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            console.log('✅ 领取成功!');
            console.log('🎉 交易已确认，区块高度:', receipt.blockNumber);
            console.log('⛽ 实际Gas使用量:', receipt.gasUsed.toString());
            console.log('💸 实际Gas费用:', ethers.formatEther(receipt.gasUsed * receipt.gasPrice), 'ETH');
        } else {
            console.log('❌ 交易失败');
        }

    } catch (error) {
        console.error('💥 领取失败:', error.message);

        if (error.code === 'CALL_EXCEPTION') {
            console.error('📋 合约调用异常，可能原因：');
            console.error('  - 已经领取过');
            console.error('  - 证明无效');
            console.error('  - 参数错误');
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            console.error('💰 余额不足，请充值ETH支付Gas费用');
        } else if (error.code === 'NETWORK_ERROR') {
            console.error('🌐 网络连接错误，请检查RPC配置');
        }
    }
}

// 主函数
async function main() {
    console.log('🎯 Base主网代币领取脚本');
    console.log('📄 合约地址:', CONFIG.CONTRACT_ADDRESS);
    console.log('='.repeat(50));

    await claimTokens();
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { claimTokens, CONFIG, CLAIM_DATA };
