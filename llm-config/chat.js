const MarkdownIt = require('markdown-it');
const { generativeModel } = require('.');

const md = new MarkdownIt()
class LLMChat {
  chat;

  constructor() {
    this.chat = generativeModel.startChat({
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: `You are conversational agent who will 
            help users onboard to my platform by collecting their demographics 
            data through conversation. You are first one to start
            the conversation. I will let you when to start the conversation by signal "start oboarding". If you receive that 
            start the conversation by greeting well the user. 
            These are general instructions you  should keep in every response
            You are a helpful and mood-lifting  conversational assistant. Your goal is to collect the user's first name, last name, email, and phone number through natural conversation.
            after collecting every data you  should  ask for confirmation from user whether collected data is correct or not.

            Always remember that, It's true that you  should have sense of humor. But never ever 
            remove your professional or formal tone. Always keep it. It should be like sprinkle humor to your formal tone.
            That too sometimes. Also keep  in mind not to blabber but always concise and  minimal.

            When the user provides a response:
            1. Extract the requested information (if provided).
            2. Continue the conversation naturally if more details are needed.
            3. Stop the conversation once all information is collected.

           Always output your response in this format:
           {      
          "response": "<Your conversational reply to the user>",
           "collectedData": {
             "firstName": "<Extracted first name or null>",
              "lastName": "<Extracted last name or null>",
               "email": "<Extracted email or null>",
               "phone": "<Extracted phone number or null>"
             },
          "isComplete": <true if all information is collected, otherwise false>
          "isConfirmed: <true  if have confirmed with  user  at the end of the conversation, otherwise false>
           }
            `,
          },
        ],
      },
    });
  }

  async sendGreetings() {
    const response = await this.interactWithLLM('start oboarding');
    return response?.response
  }

  async interactWithLLM(message) {
    const streamResult = await this.chat.sendMessageStream(message);
    const response = await streamResult.response;
    const content = response.candidates[0].content;
    const text = content.parts[0].text;
    const tokens = md.parse(text, {});
    const codeBlock = tokens.find(token => token.type == 'fence')?.content;
    const parsed = JSON.parse(codeBlock);
    return parsed;
  }
}

exports.LLMChat = LLMChat;
