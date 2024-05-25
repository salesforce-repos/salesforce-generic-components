public class QueryEditorController {
        @AuraEnabled (cacheable=true)//Method to get the List of All Objects
    public static Map<String, String> getAllObject(){
        
        Map<String,String> returnObjectMap = new Map<String,String>();
        
        //Schema.getGlobalDescribe() => return a Map of type Map<String, Schema.SObjectType>
        Map<String, Schema.SObjectType> objectMap = Schema.getGlobalDescribe();
        
        //get List of all sObject
        List<Schema.SObjectType> objectMapValues = objectMap.Values();
        System.debug('All Objects '+ objectMapValues);
        
        //prepare a Map to send Data from Server to Client Side
        
        for(Schema.SObjectType objType : objectMapValues){
            String name = objType.getDescribe().getName();
            if (objType.getDescribe().isCustom() && !name.containsignorecase('history') && !name.containsignorecase('tag') && !name.containsignorecase('share') && !name.containsignorecase('feed')) {
                    String key = objType.getDescribe().getName();
                    String value = objType.getDescribe().getLabel();
                    returnObjectMap.put(key,value);
                }
            
        }
        System.debug(returnObjectMap);
        if(returnObjectMap != null && returnObjectMap.size() > 0){
            return returnObjectMap;
        }else{
            return null;
        }
    }
    
        @AuraEnabled (cacheable=true) //Method to get all the fields of a particular Object
    public static List<String> getAllfields(String sObjectName){
        List<String> allFields = new List<String>();
        
        Map<String, Schema.SObjectType> objectMap = Schema.getGlobalDescribe();
        SObjectType objType = objectMap.get(sObjectName);
        
        // Map of fields with api name and Api name as value
        Map<String,Schema.SObjectField> objTypeFields = objType.getDescribe().fields.getMap();
        if(!objTypeFields.isEmpty()){
            for (String fieldName: objTypeFields.keySet()) {
                //getting labels of the fields
                String fieldLabel = objTypeFields.get(fieldName).getDescribe().getLabel();
                allFields.add(fieldLabel);
            }
        }
        System.debug(allFields);
        return allFields;
    }
    
    @AuraEnabled
    public static List<FieldInfoWrapper> getObjectFields(String sObjectName) {
        List<FieldInfoWrapper> fieldInfoList = new List<FieldInfoWrapper>();
        
        // Get the object describe result
        Schema.DescribeSObjectResult objectDescribe = Schema.getGlobalDescribe().get(sObjectName).getDescribe();
        Map<String, Schema.SObjectField> fieldsMap = objectDescribe.fields.getMap();
        
        for (String fieldName : fieldsMap.keySet()) {
            Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();
            FieldInfoWrapper fieldInfo = new FieldInfoWrapper();
            fieldInfo.name = fieldDescribe.getName();
            fieldInfo.label = fieldDescribe.getLabel();
            fieldInfo.dataType = String.valueOf(fieldDescribe.getType());
            
            // For picklist fields, fetch picklist values with both labels and API names
            if (fieldDescribe.getType() == Schema.DisplayType.Picklist) {
                List<Schema.PicklistEntry> picklistValues = fieldDescribe.getPicklistValues();
                List<PicklistOption> picklistOptions = new List<PicklistOption>();
                for (Schema.PicklistEntry entry : picklistValues) {
                    PicklistOption option = new PicklistOption();
                    option.label = entry.getLabel();
                    option.value = entry.getValue();
                    picklistOptions.add(option);
                }
                fieldInfo.picklistOptions = picklistOptions;
            }
            // Add more necessary information to the wrapper class as needed
            
            fieldInfoList.add(fieldInfo);
        }
        
        return fieldInfoList;
    }
    
     @AuraEnabled
    public static List<Sobject> fetchData(String soqlQuery){
        List<Sobject> sobjectData = new List<Sobject>(); 
        System.debug('Test: '+ soqlQuery);
        try {
            sobjectData = Database.query(soqlQuery);
            

        }
        catch(Exception ex) {
            throw new AuraHandledException('Unable to fetch data'+ex);
        }
        
        return sobjectData;
        
    }
    
    @AuraEnabled(cacheable = true)
    public static List<PicklistOption> getOptionsForSelectedPicklistField(string selectedObjectName, string selectedField){
        List<PicklistOption> picklistOptions = new List<PicklistOption>();
        try {
            System.debug('selectedObjectName '+selectedObjectName);
            System.debug('selectedField '+selectedField);
            Map<String,String> options = new  Map<String,String>();
            
            Map<String, Schema.SObjectField> mapFields = Schema.getGlobalDescribe().get(selectedObjectName).getDescribe().fields.getMap();
            Schema.DescribeFieldResult pickFieldResult = mapFields.get(selectedField).getDescribe();   
            List<Schema.PicklistEntry> picklistFields1 = pickFieldResult.getPicklistValues();
                for( Schema.PicklistEntry pickListFields2 : picklistFields1)
                {
                     PicklistOption option = new PicklistOption();
                    option.label = pickListFields2.getLabel();
                    option.value = pickListFields2.getValue();
                    picklistOptions.add(option);
                }       
            return picklistOptions;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch data');
        }
    }
    
    public class FieldInfoWrapper {
        @AuraEnabled public String name;
        @AuraEnabled public String label;
        @AuraEnabled public String dataType;
		@AuraEnabled public List<PicklistOption> picklistOptions;        
        // Add more properties as needed
    }
    
     public class PicklistOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

}