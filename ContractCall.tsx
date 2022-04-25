import { ethers } from 'ethers'
import { ERC20Abi } from './constant/ERC20Abi'
import { tokenAddress } from './constant/tokenAddress'
import { AiContractAddress, AiContractAbi, ByteCode } from './constant/AiContract'


export class ContractCall {

  private privateKey : string;

  // Rpc 노드 연결
  static provider = new ethers.providers.JsonRpcProvider("ethereumRpcUrl");
  // 클라이언트 지갑 연결
  static signer;

  constructor (privateKey: string) {

      this.privateKey = privateKey
      ContractCall.signer = new ethers.Wallet(this.privateKey, ContractCall.provider);

  }

  // AiModelToken 발행하는 함수
  async deployAiContract(tokenName : string, 
      tokenSymbol : string, tokenSupply : number) {
  
      // 배포할 aiContractFactory 셍성
      const aiContractFactory = new ethers.ContractFactory(AiContractAbi, ByteCode, ContractCall.signer);

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
  async transactionForAi(dataUrl : string, 
    aiModelUrl : string, etherAmount : number) {

      // Ai contract
      const aiContract = new ethers.Contract(AiContractAddress[0], AiContractAbi, ContractCall.signer);
      // Ai model token contract
      const erc20TokenContract = new ethers.Contract(tokenAddress[0], ERC20Abi, ContractCall.signer);
  
      // swap Eth for Model Token
      await aiContract.swapEthToModel({value: ethers.utils.parseEther(etherAmount)});
  
      // 데이터 분석 프로세스 시작
      let fileSize : number;
      let accuracy : number;
      
      //  1. dataUrl에서 읽어온 데이터 크기 확인
      const fs  = require('fs');
      fs.readFile(dataUrl, (err, data) => {
        fileSize =  data.toString().length
      })

      // 2. aiModelUrl에 있는 모델에 데이터 url 전달하여 실행(데이터 전처리, 분석 및 학습)
      const spawn = require('child_process').spawn;
      const result = spawn('python', ['aiModelUrl', 'dataUrl'])
      // 3. 결과 반환(결과 정확도 블록체인 상에 기록 위함)
      result.stdout.on('data', (data) => {  accuracy = data.toString().parseInt() });
      // 데이터 분석 종료


      // send model token to developer
      // allowance max_num
      const maxNum = ethers.constants.MaxUint256;
      // check allowance
      const allowance = await erc20TokenContract
      .allowance(ContractCall.signer, AiContractAddress[0]);
      // if allowance === 0, approve
      allowance.toString() === '0' ? erc20TokenContract.approve(AiContractAddress[0], maxNum) : ' ';
      // amount to pay
      const fromAmount = ethers.utils.parseEther(fileSize);
      await erc20TokenContract
      .transfer({data: ethers.utils.parseEther(accuracy)}, 
      aiContract.getDeveloper(), fromAmount);
  
  }

}