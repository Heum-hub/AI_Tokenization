import { ethers } from 'ethers'
import { ERC20Abi } from './constant/ERC20Abi'
import { tokenAddress } from './constant/tokenAddress'
import { AiContractAddress, AiContractAbi, ByteCode } from './constant/AiContract'


// 컨트랙트 콜하는 지갑 개인키
const privateKey = "privateKey";
// Rpc 노드 연결
const provider = new ethers.providers.JsonRpcProvider("ethereumRpcUrl");
// 클라이언트 지갑 연결
const signer = new ethers.Wallet(privateKey, provider);

// AiModelToken 발행하는 함수
function deployAiContract(tokenName, tokenSymbol, tokenSupply) {
    // 배포할 aiContractFactory 셍성
    const aiContractFactory = new ethers.ContractFactory(AiContractAbi, ByteCode, signer);
    // 컨트랙트에 파라미터 주입
    const aiContract = await aiContractFactory.deploy( 
    tokenName, tokenSymbol, tokenSupply); 
    // 컨트랙트 주소 추가
    const aiContractAddress = aiContract.address;
    AiContractAddress.push(aiContractAddress);
    // 배포 및 로깅
    console.log(await aiContract.deployTransaction.wait());

}

// AiModel 활용한 분석, 학습 및 이를 위한 클라이언트의 토큰 지불하는 함수
function transactionForAi(globalServerUrl, etherAmount) {
    // Ai contract
    const aiContract = new ethers.Contract(AiContractAddress[0], AiContractAbi, signer);
    // Ai model token contract
    const erc20TokenContract = new ethers.Contract(tokenAddress[0], ERC20Abi, signer);
    // swap Eth for Model Token
    await aiContract.swapEthToModel({value: ethers.utils.parseEther(etherAmount)});
  
    // 데이터 분석 프로세스 시작
    let dataSize;
    let accuracy;
    function setDataSizeAndAccuracy(dataSize, accuracy) {
      this.dataSize = dataSize;
      this.accuracy = accuracy;
    }      
    // 글로벌 서버에 요청하여 분석 학습 실행 후 데이터 사이즈와 정확도 결과 받아옴 
    fetch(globalServerUrl)
    .then(response => response.json())
    .then(data => {
      setDataSizeAndDataSize(data.dataSize, data.accuracy);
    });
    // 데이터 분석 종료


    // 모델 토큰 전송 프로세스 시작
    const maxNum = ethers.constants.MaxUint256;
    const allowance = await erc20TokenContract
    .allowance(ContractCall.signer, AiContractAddress[0]);
    
    allowance.toString() === '0' ? erc20TokenContract.approve(AiContractAddress[0], maxNum) : ' ';
    
    const fromAmount = ethers.utils.parseEther(dataSize);
    
    await erc20TokenContract
    .transfer({data: ethers.utils.parseEther(accuracy)}, 
    aiContract.getDeveloper(), fromAmount);
  
}