import { ethers } from 'ethers'
import { ERC20Abi } from './constant/ERC20Abi'
import { tokenAddress } from './constant/tokenAddress'
import { AiContractAddress, AiContractAbi, ByteCode } from './constant/AiContract'


// AiModelToken 발행하는 함수
export async function deployAiContract(privateKey : string, tokenName : string, 
  tokenSymbol : string, tokenSupply : number) {
  
  // Rpc 노드 연결
  const provider = new ethers.providers.JsonRpcProvider("ethereumRpcUrl");
  // 클라이언트 지갑 연결
  const signer = new ethers.Wallet(privateKey, provider);
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
export async function transactionForAi(privateKey : string, dataUrl : string, aiModelUrl : string, etherAmount : number) {
  
  // Rpc 노드 연결
  const provider = new ethers.providers.JsonRpcProvider("ethereumRpcUrl");
  // 클라이언트 지갑 연결
  const signer = new ethers.Wallet(privateKey, provider);

  // Ai contract
  const aiContract = new ethers.Contract(AiContractAddress[0], AiContractAbi, signer);
  // Ai model token contract
  const erc20TokenContract = new ethers.Contract(tokenAddress[0], ERC20Abi, signer);
  
  // swap Eth for Model Token
  await aiContract.swapEthToModel({value: ethers.utils.parseEther(etherAmount)});
  
  /*
    데이터 분석 시작
    1. dataUrl에서 읽어온 데이터 전처리
    2. aiModelUrl에서 읽어온 모델로 분석 및 학습
    3. 결과 반환
  */

  // 결과 정확도 블록체인 상에 기록
  const accuracy = " ";

  // send model token to developer
  // allowance max_num
  const maxNum = ethers.constants.MaxUint256;
  // check allowance
  const allowance = await erc20TokenContract
  .allowance(signer, AiContractAddress[0]);
  // if allowance === 0, approve
  allowance.toString() === '0' ? erc20TokenContract.approve(AiContractAddress[0], maxNum) : ' ';
  // amount to pay
  const fromAmount = ethers.utils.parseEther(/*dataUrl에서 읽어온 파일 크기*/);
  await erc20TokenContract
  .transfer({data: ethers.utils.parseEther(accuracy)}, 
  aiContract.getDeveloper(), fromAmount);
  

  
}
